import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const defaultDiffPath = path.join(exampleRoot, "fixtures/sample.diff");

const HIGH_RISK_PATTERNS = [
  { pattern: /\/payments\//i, score: 40, reason: "Touches payment code." },
  { pattern: /\/auth\//i, score: 35, reason: "Touches authentication code." },
  { pattern: /gateway/i, score: 25, reason: "Changes an external integration boundary." },
  { pattern: /migration/i, score: 20, reason: "Touches schema or migration logic." }
];

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveDiffPath(override?: string): string {
  return override?.trim() || process.env.PR_DIFF_PATH?.trim() || defaultDiffPath;
}

export async function readPrDiff(args: { diff_path?: SDKJsonValue }) {
  const diffPath = resolveDiffPath(readString(args.diff_path));

  try {
    const content = await fs.readFile(diffPath, "utf8");
    return {
      found: true,
      diff_path: diffPath,
      content,
      line_count: content.split("\n").length
    };
  } catch {
    return {
      found: false,
      diff_path: diffPath,
      content: null,
      line_count: 0
    };
  }
}

export function listChangedFiles(args: { diff?: SDKJsonValue }) {
  const diff = typeof args.diff === "string" ? args.diff : "";
  const files = new Set<string>();

  for (const line of diff.split("\n")) {
    const match = line.match(/^\+\+\+ b\/(.+)$/);
    if (match?.[1] && match[1] !== "/dev/null") {
      files.add(match[1]);
    }
  }

  const changedFiles = [...files];

  return {
    changed_files: changedFiles,
    count: changedFiles.length
  };
}

export function scoreChangedFiles(args: { changed_files?: SDKJsonValue }) {
  const files = Array.isArray(args.changed_files)
    ? args.changed_files.filter((item): item is string => typeof item === "string")
    : [];

  const scored = files.map((file) => {
    let score = 10;
    const reasons: string[] = ["File changed in the pull request."];

    for (const rule of HIGH_RISK_PATTERNS) {
      if (rule.pattern.test(file)) {
        score += rule.score;
        reasons.push(rule.reason);
      }
    }

    return {
      file,
      score,
      reasons
    };
  });

  scored.sort((left, right) => right.score - left.score);
  const top = scored[0] ?? null;
  const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
  const band =
    totalScore >= 80 ? "high" : totalScore >= 45 ? "medium" : "low";

  return {
    files: scored,
    count: scored.length,
    total_score: totalScore,
    risk_band: band,
    highest_risk_file: top?.file ?? null,
    highest_risk_score: top?.score ?? 0
  };
}

export function buildRiskClassifierPrompt(title: string): string {
  return [
    "You are the PR Risk Classifier Agent.",
    "Read the diff, list changed files, and call score_changed_files before you classify risk.",
    "Ground the risk band and routing recommendation in the tool result.",
    "Do not invent files or scores that the tools did not return.",
    "Return markdown with these sections:",
    "1. Risk band (low, medium, or high)",
    "2. Highest-risk file",
    "3. Routing recommendation",
    "4. Evidence from tool results",
    "5. What a human reviewer should focus on",
    `Pull request title: ${title || "Add refund support to checkout"}`
  ].join("\n");
}

export function createRiskClassifierCustomTools() {
  return {
    read_pr_diff: {
      description:
        "Read the unified diff for the pull request. Defaults to the example fixture when PR_DIFF_PATH is unset.",
      inputSchema: {
        type: "object",
        properties: {
          diff_path: {
            type: "string",
            description: "Optional absolute or repo-relative path to a diff file"
          }
        }
      },
      execute: (args: { diff_path?: SDKJsonValue }) => readPrDiff(args)
    },
    list_changed_files: {
      description:
        "Parse a unified diff and return the changed file paths from +++ b/ headers.",
      inputSchema: {
        type: "object",
        properties: {
          diff: {
            type: "string",
            description: "Unified diff text"
          }
        },
        required: ["diff"]
      },
      execute: (args: { diff?: SDKJsonValue }) => listChangedFiles(args)
    },
    score_changed_files: {
      description:
        "Score changed files with deterministic path rules and return a risk band.",
      inputSchema: {
        type: "object",
        properties: {
          changed_files: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["changed_files"]
      },
      execute: (args: { changed_files?: SDKJsonValue }) => scoreChangedFiles(args)
    }
  };
}
