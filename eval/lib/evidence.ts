import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SDKMessage } from "@cursor/sdk";
import type { AgentRunOutcome } from "./run-agent.js";
import type {
  ArtifactRef,
  EvalCase,
  EvalContext,
  RunEvidence,
  TestRunRecord,
  WorkspaceSnapshot
} from "./types.js";

function sha256File(absolutePath: string): string {
  const bytes = readFileSync(absolutePath);
  return createHash("sha256").update(bytes).digest("hex");
}

export function collectArtifactRefs(
  repoRoot: string,
  relativePaths: string[]
): ArtifactRef[] {
  return relativePaths.map((relativePath) => {
    const absolutePath = path.join(repoRoot, relativePath);
    return {
      path: relativePath,
      sha256: sha256File(absolutePath)
    };
  });
}

export function extractRequestIds(messages: SDKMessage[]): string[] {
  const ids = new Set<string>();

  for (const message of messages) {
    if ("request_id" in message && typeof message.request_id === "string") {
      ids.add(message.request_id);
    }
  }

  return [...ids];
}

export function buildRunEvidence(options: {
  evalCase: EvalCase;
  outcome: AgentRunOutcome;
  workspace: WorkspaceSnapshot;
  startedAt: string;
  finishedAt: string;
  tests?: TestRunRecord[];
  artifactPaths?: string[];
  ctx: EvalContext;
}): RunEvidence {
  const { evalCase, outcome, workspace, startedAt, finishedAt, ctx } = options;

  return {
    caseId: evalCase.id,
    runId: outcome.result.id,
    requestIds: extractRequestIds(outcome.messages),
    startedAt,
    finishedAt,
    finalOutput: outcome.result.result ?? "",
    status: outcome.result.status,
    prompt: "",
    messages: outcome.messages,
    completedToolCalls: outcome.completedToolCalls,
    workspace,
    tests: options.tests ?? [],
    artifacts: collectArtifactRefs(ctx.repoRoot, options.artifactPaths ?? [])
  };
}
