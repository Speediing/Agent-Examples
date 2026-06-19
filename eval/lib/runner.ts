import { llmEvalsEnabled, requireLlmEvals } from "./config.js";
import { buildRunEvidence } from "./evidence.js";
import { writeFailureArtifact } from "./artifacts.js";
import { allGradersPassed, gradeAll } from "./graders/index.js";
import { runLocalAgent } from "./run-agent.js";
import {
  captureWorkspaceSnapshot,
  cleanupWorkspace,
  finalizeWorkspaceSnapshot,
  prepareWorkspace
} from "./workspace.js";
import type { EvalCase, EvalCaseResult } from "./types.js";

export async function runEvalCase(evalCase: EvalCase): Promise<EvalCaseResult> {
  if (evalCase.tier > 0) {
    requireLlmEvals();
  }

  const startedAt = new Date().toISOString();
  const ctx = prepareWorkspace(evalCase.workspace);
  const workspaceBefore = captureWorkspaceSnapshot(ctx.workspaceDir);

  try {
    if (evalCase.prepare) {
      await evalCase.prepare(ctx);
    }

    const runInput = await evalCase.run(ctx);
    const outcome = await runLocalAgent({
      prompt: runInput.prompt,
      customTools: runInput.customTools,
      cwd: runInput.cwd ?? ctx.workspaceDir
    });

    const workspaceAfter = finalizeWorkspaceSnapshot(workspaceBefore);
    const finishedAt = new Date().toISOString();
    const artifactPaths = [
      ...(evalCase.workspace?.copyFiles.map((copy) => copy.from) ?? []),
      ...(evalCase.workspace?.cleanupPaths ?? [])
    ];

    const evidence = buildRunEvidence({
      evalCase,
      outcome,
      workspace: workspaceAfter,
      startedAt,
      finishedAt,
      artifactPaths,
      ctx
    });
    evidence.prompt = runInput.prompt;

    if (evalCase.postRun) {
      await evalCase.postRun(ctx, evidence);
    }

    const graderResults = await gradeAll(evalCase.graders, evidence, ctx);
    const result: EvalCaseResult = {
      caseId: evalCase.id,
      pass: allGradersPassed(graderResults),
      evidence,
      graderResults
    };

    result.artifactPath = writeFailureArtifact(result);
    return result;
  } finally {
    cleanupWorkspace(ctx, evalCase.workspace);
  }
}

export function llmCasesEnabled(): boolean {
  return llmEvalsEnabled();
}
