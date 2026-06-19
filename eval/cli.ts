#!/usr/bin/env node
import { getEvalCase, listEvalCases } from "./cases/index.js";
import { llmCasesEnabled } from "./lib/runner.js";
import { runEvalCase } from "./lib/runner.js";

function printUsage(): void {
  console.log(`Usage:
  npm run eval:list [-- --tier 1]
  npm run eval:run -- --case <case-id>
  npm run eval:run -- --tier 1

Commands:
  list    Print registered SDLC eval cases
  run     Execute one case or every case in a tier`);
}

function parseArgs(argv: string[]): {
  command: "list" | "run" | "help";
  caseId?: string;
  tier?: 0 | 1 | 2;
} {
  const [command = "help", ...rest] = argv;
  let caseId: string | undefined;
  let tier: 0 | 1 | 2 | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--case") {
      caseId = rest[index + 1];
      index += 1;
      continue;
    }

    if (token === "--tier") {
      const value = Number(rest[index + 1]);
      if (value === 0 || value === 1 || value === 2) {
        tier = value;
      }
      index += 1;
    }
  }

  if (command === "list" || command === "run") {
    return { command, caseId, tier };
  }

  return { command: "help" };
}

async function runCases(caseIds: string[]): Promise<number> {
  let failures = 0;

  for (const caseId of caseIds) {
    const evalCase = getEvalCase(caseId);
    if (!evalCase) {
      console.error(`Unknown case: ${caseId}`);
      failures += 1;
      continue;
    }

    if (evalCase.tier > 0 && !llmCasesEnabled()) {
      console.error(
        `Skipping ${caseId}: set CURSOR_API_KEY and CURSOR_MODEL to run tier ${evalCase.tier} cases.`
      );
      failures += 1;
      continue;
    }

    console.log(`Running ${caseId} ...`);
    const result = await runEvalCase(evalCase);
  const failedGraders = result.graderResults.filter((entry) => !entry.pass);

    if (result.pass) {
      console.log(`PASS ${caseId}`);
      continue;
    }

    failures += 1;
    console.error(`FAIL ${caseId}`);
    for (const grader of failedGraders) {
      console.error(`  - ${grader.grader}: ${grader.message ?? "failed"}`);
    }

    if (result.artifactPath) {
      console.error(`  artifact: ${result.artifactPath}`);
    }
  }

  return failures;
}

async function main(): Promise<void> {
  const { command, caseId, tier } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command === "list") {
    const cases = listEvalCases(tier === undefined ? undefined : { tier });
    for (const evalCase of cases) {
      console.log(
        `${evalCase.id}\t tier=${evalCase.tier}\t stage=${evalCase.stage}\t ${evalCase.description}`
      );
    }
    return;
  }

  const caseIds = caseId
    ? [caseId]
    : listEvalCases(tier === undefined ? undefined : { tier }).map(
        (evalCase) => evalCase.id
      );

  if (caseIds.length === 0) {
    console.error("No cases matched the filter.");
    process.exitCode = 1;
    return;
  }

  const failures = await runCases(caseIds);
  process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
