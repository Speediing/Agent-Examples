import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const defaultRunsPath = path.join(exampleRoot, "fixtures/ci-runs.json");

type CiRun = { run_id: number; passed: boolean };

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveRunsPath(override?: string): string {
  return override?.trim() || process.env.CI_RUNS_PATH?.trim() || defaultRunsPath;
}

export async function loadCiRuns(runsPath: string): Promise<Record<string, CiRun[]>> {
  const raw = await fs.readFile(runsPath, "utf8");
  return JSON.parse(raw) as Record<string, CiRun[]>;
}

export function computeFlakeRate(runs: CiRun[]) {
  if (runs.length === 0) {
    return { total_runs: 0, failures: 0, failure_rate: 0, is_flaky: false };
  }
  const failures = runs.filter((run) => !run.passed).length;
  const failureRate = failures / runs.length;
  const isFlaky =
    runs.length >= 5 && failureRate > 0.05 && failureRate < 0.95;
  return {
    total_runs: runs.length,
    failures,
    failure_rate: Math.round(failureRate * 1000) / 1000,
    is_flaky: isFlaky,
  };
}

export async function analyzeCiRuns(args: {
  test_file?: SDKJsonValue;
  runs_path?: SDKJsonValue;
}) {
  const testFile = readString(args.test_file) || "payments.integration.test.ts";
  const runsPath = resolveRunsPath(readString(args.runs_path));
  const allRuns = await loadCiRuns(runsPath);
  const runs = allRuns[testFile] ?? [];
  const stats = computeFlakeRate(runs);

  return {
    test_file: testFile,
    runs_path: runsPath,
    ...stats,
    actionable: stats.is_flaky
      ? [
          {
            id: `flake-${testFile.replace(/[^\w]+/g, "-")}`,
            kind: "test",
            summary: `${testFile} failed ${stats.failures} of last ${stats.total_runs} runs (${stats.failure_rate} rate)`,
          },
        ]
      : [],
    count: stats.is_flaky ? 1 : 0,
    writes_enabled: false,
  };
}

export function buildFlakeHunterPrompt(task: string): string {
  return [
    "You are the Flake Hunter.",
    "CI-history flake audit.",
    "Call analyze_ci_runs first. Quarantine only when is_flaky is true.",
    "Cite failure_rate and run counts from tool output only.",
    `Task: ${task || "Audit flaky tests from CI history."}`,
  ].join("\n");
}

export function createFlakeHunterCustomTools() {
  return {
    analyze_ci_runs: {
      description:
        "Load CI run history from a fixture and compute flake rates per test file.",
      inputSchema: {
        type: "object",
        properties: {
          test_file: {
            type: "string",
            description: "Test file path key in the CI runs fixture",
          },
          runs_path: {
            type: "string",
            description: "Optional path to ci-runs.json",
          },
        },
      },
      execute: (args: {
        test_file?: SDKJsonValue;
        runs_path?: SDKJsonValue;
      }) => analyzeCiRuns(args),
    },
  };
}
