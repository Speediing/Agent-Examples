#!/usr/bin/env node
import { getEvalCase, listEvalCases } from "./cases/index.js";
import { llmCasesEnabled } from "./lib/runner.js";
import { runEvalCase } from "./lib/runner.js";

function printUsage(): void {
  console.log(`Usage:
  npm run eval:list [-- --requires-model]
  npm run eval:run -- --case <case-id>
  npm run eval:run -- --requires-model

Commands:
  list    Print registered SDLC eval cases
  run     Execute one case or every case that matches a filter`);
}

function parseArgs(argv: string[]): {
  command: "list" | "run" | "help";
  caseId?: string;
  requiresModel?: boolean;
} {
  const [command = "help", ...rest] = argv;
  let caseId: string | undefined;
  let requiresModel: boolean | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--case") {
      caseId = rest[index + 1];
      index += 1;
      continue;
    }

    if (token === "--requires-model") {
      requiresModel = true;
    }
  }

  if (command === "list" || command === "run") {
    return { command, caseId, requiresModel };
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

    if (evalCase.requiresModel && !llmCasesEnabled()) {
      console.error(
        `Skipping ${caseId}: set CURSOR_API_KEY and CURSOR_MODEL to run model cases.`
      );
      failures += 1;
      continue;
    }

    console.log(`Running ${caseId} ...`);
    let result;
    try {
      result = await runEvalCase(evalCase);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${caseId}`);
      console.error(
        `  - error: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }

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
  const { command, caseId, requiresModel } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command === "list") {
    const cases = listEvalCases(
      requiresModel === undefined ? undefined : { requiresModel }
    );
    for (const evalCase of cases) {
      console.log(
        `${evalCase.id}\t model=${evalCase.requiresModel ? "yes" : "no"}\t stage=${evalCase.stage}\t ${evalCase.description}`
      );
    }
    return;
  }

  const caseIds = caseId
    ? [caseId]
    : listEvalCases(requiresModel === undefined ? undefined : { requiresModel }).map(
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
