import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type CoverageGap = {
  file: string;
  changed_lines: number[];
  uncovered_lines: number[];
  suggested_test: string;
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadCoverageGap(): CoverageGap {
  const raw = fs.readFileSync(
    path.join(exampleRoot, "fixtures/coverage-gap.json"),
    "utf8",
  );
  return JSON.parse(raw) as CoverageGap;
}

export function analyzeCoverageGap(args: { file?: SDKJsonValue }) {
  const gap = loadCoverageGap();
  const file = readString(args.file) || gap.file;
  return {
    file,
    changed_lines: gap.changed_lines,
    uncovered_lines: gap.uncovered_lines,
    uncovered_count: gap.uncovered_lines.length,
    suggested_test: gap.suggested_test,
  };
}

export function buildTestCoverageAgentPrompt(task: string): string {
  return [
    "You are the Test Coverage Agent.",
    "Coverage gap finder.",
    "Call analyze_coverage_gap first. Propose tests only for uncovered_lines from tool output.",
    `Task: ${task || "Find untested changed lines from the coverage fixture."}`,
  ].join("\n");
}

export function createTestCoverageAgentCustomTools() {
  return {
    analyze_coverage_gap: {
      description: "Return changed and uncovered line ranges from a coverage report fixture.",
      inputSchema: {
        type: "object",
        properties: {
          file: { type: "string", description: "Application file path" },
        },
      },
      execute: (args: { file?: SDKJsonValue }) => analyzeCoverageGap(args),
    },
  };
}
