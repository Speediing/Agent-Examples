#!/usr/bin/env node
import { loadDefinedEvals } from "./lib/discover-evals.js";
import type { EvalCaseResult } from "./lib/types.js";
import type { DefinedEvalHandle } from "./lib/define-eval.js";

function printUsage(): void {
  console.log(`Usage:
  npm run eval
  npm run eval:list [-- --requires-model]
  npm run eval:run -- --case <case-id>
  npm run eval:run -- --requires-model

Commands:
  eval    Run every evals/*.eval.ts file (defineEval)
  list    Print registered SDLC eval cases (Agent-Examples catalog)
  run     Execute one catalog case or every case that matches a filter`);
}

function parseArgs(argv: string[]): {
  command: "eval" | "list" | "run" | "help";
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

  if (command === "eval" || command === "list" || command === "run") {
    return { command, caseId, requiresModel };
  }

  return { command: "help" };
}

function llmCasesEnabled(): boolean {
  return Boolean(
    process.env.CURSOR_API_KEY &&
      (process.env.CURSOR_MODEL ?? process.env.CURSOR_AGENT_MODEL)
  );
}

function printResult(label: string, result: EvalCaseResult): number {
  if (result.pass) {
    console.log(`PASS ${label}`);
    return 0;
  }

  console.error(`FAIL ${label}`);
  for (const grader of result.graderResults.filter((entry) => !entry.pass)) {
    console.error(`  - ${grader.grader}: ${grader.message ?? "failed"}`);
  }

  if (result.artifactPath) {
    console.error(`  artifact: ${result.artifactPath}`);
  }

  return 1;
}

async function runDefinedEvalHandle(handle: DefinedEvalHandle): Promise<number> {
  if (handle.requiresModel !== false && !llmCasesEnabled()) {
    console.error(
      `Skipping ${handle.id}: set CURSOR_API_KEY and CURSOR_MODEL to run model evals.`
    );
    return 1;
  }

  console.log(`Running ${handle.id} ...`);
  try {
    const result = await handle.run();
    return printResult(handle.id, result);
  } catch (error) {
    console.error(`FAIL ${handle.id}`);
    console.error(
      `  - error: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}

async function runCatalogCases(caseIds: string[]): Promise<number> {
  const { getEvalCase } = await import("./cases/index.js");
  const { runEvalCase } = await import("./lib/runner.js");
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
    try {
      const result = await runEvalCase(evalCase);
      failures += printResult(caseId, result);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${caseId}`);
      console.error(
        `  - error: ${error instanceof Error ? error.message : String(error)}`
      );
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

  if (command === "eval") {
    const handles = await loadDefinedEvals();
    if (handles.length === 0) {
      console.error("No eval/evals/*.eval.ts files found.");
      process.exitCode = 1;
      return;
    }

    let failures = 0;
    for (const handle of handles) {
      failures += await runDefinedEvalHandle(handle);
    }
    process.exitCode = failures > 0 ? 1 : 0;
    return;
  }

  const { listEvalCases } = await import("./cases/index.js");

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

  const failures = await runCatalogCases(caseIds);
  process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
