import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const defaultDiffPath = path.join(exampleRoot, "fixtures/missing-tests.diff");

const APP_PREFIX = "src/";
const TEST_PREFIXES = ["tests/", "test/", "__tests__/"];

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
      line_count: content.split("\n").length,
    };
  } catch {
    return {
      found: false,
      diff_path: diffPath,
      content: null,
      line_count: 0,
    };
  }
}

export function listChangedFiles(diff: string): string[] {
  const files = new Set<string>();
  for (const line of diff.split("\n")) {
    const match = line.match(/^\+\+\+ b\/(.+)$/);
    if (match?.[1] && match[1] !== "/dev/null") {
      files.add(match[1]);
    }
  }
  return [...files];
}

function isAppFile(filePath: string): boolean {
  return filePath.startsWith(APP_PREFIX) && !TEST_PREFIXES.some((p) => filePath.includes(p));
}

function isTestFile(filePath: string): boolean {
  return TEST_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function expectedTestGlobs(appFile: string): string[] {
  const base = path.basename(appFile, path.extname(appFile));
  const dir = path.dirname(appFile).replace(/^src\//, "");
  return [
    `tests/${dir}/${base}.test.ts`,
    `tests/${dir}/${base}.spec.ts`,
    `test/${dir}/${base}.test.ts`,
  ];
}

export function checkTestPresence(args: { diff?: SDKJsonValue }) {
  const diff = typeof args.diff === "string" ? args.diff : "";
  const changed = listChangedFiles(diff);
  const changedTests = new Set(changed.filter(isTestFile));
  const violations: { id: string; path: string; summary: string }[] = [];

  for (const file of changed.filter(isAppFile)) {
    const expected = expectedTestGlobs(file);
    const hasTest = expected.some(
      (candidate) => changedTests.has(candidate) || changed.includes(candidate),
    );
    if (!hasTest) {
      violations.push({
        id: "test/missing-coverage",
        path: file,
        summary: `Application file changed without matching test in diff (expected one of: ${expected.join(", ")})`,
      });
    }
  }

  return {
    target: "pr-diff",
    changed_files: changed,
    violations,
    count: violations.length,
    passed: violations.length === 0,
  };
}

export function buildTestPresenceGatePrompt(task: string): string {
  return [
    "You are the Test Presence Gate.",
    "Diff-based test presence gate.",
    "Read the PR diff, then call check_test_presence. Cite violation ids from tool output.",
    "Do not claim pass when passed is false.",
    `Task: ${task || "Scan the PR diff for missing tests."}`,
  ].join("\n");
}

export function createTestPresenceGateCustomTools() {
  return {
    read_pr_diff: {
      description:
        "Read the unified diff for the pull request. Defaults to the example fixture when PR_DIFF_PATH is unset.",
      inputSchema: {
        type: "object",
        properties: {
          diff_path: {
            type: "string",
            description: "Optional absolute or repo-relative path to a diff file",
          },
        },
      },
      execute: (args: { diff_path?: SDKJsonValue }) => readPrDiff(args),
    },
    check_test_presence: {
      description:
        "Parse a unified diff and fail when application files change without matching test files in the same diff.",
      inputSchema: {
        type: "object",
        properties: {
          diff: { type: "string", description: "Unified diff text" },
        },
        required: ["diff"],
      },
      execute: (args: { diff?: SDKJsonValue }) => checkTestPresence(args),
    },
  };
}
