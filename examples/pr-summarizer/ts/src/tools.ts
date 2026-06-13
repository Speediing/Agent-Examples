import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const defaultDiffPath = path.join(exampleRoot, "fixtures/sample.diff");

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

export function buildPrSummarizerPrompt(title: string): string {
  return [
    "You are the PR Summarizer Agent.",
    "Read the pull request diff with your tools before you write the walkthrough.",
    "Name the riskiest changed file and explain why it matters.",
    "Do not invent files or behavior that the diff tools did not return.",
    "Return markdown with these sections:",
    "1. Summary",
    "2. What changed",
    "3. Riskiest file and why",
    "4. What to read first",
    "5. Questions for the author",
    `Pull request title: ${title || "Add refund support to checkout"}`
  ].join("\n");
}

export function createPrSummarizerCustomTools() {
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
    }
  };
}
