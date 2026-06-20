import type { EvalAgent } from "./agent-harness.js";
import { writeFailureArtifact } from "./artifacts.js";
import { buildRunEvidence } from "./evidence.js";
import { requireLlmEvals } from "./config.js";
import type { ExpectMatcher } from "./expect.js";
import { runLocalAgent } from "./run-agent.js";
import {
  captureWorkspaceSnapshot,
  cleanupWorkspace,
  finalizeWorkspaceSnapshot,
  prepareWorkspace
} from "./workspace.js";
import type { EvalCaseResult, GraderResult, SdlcStage } from "./types.js";
import type { NormalizedToolCall } from "./trace.js";

export type EvalTestContext = {
  reply: string;
  status: string;
  completedToolCalls: NormalizedToolCall[];
  /** User message passed to the agent's `send` method. */
  send: (userMessage: string) => Promise<void>;
  completed: () => void;
  calledTool: (toolName: string) => void;
  check: (value: string, matcher: ExpectMatcher) => void;
};

export type DefinedEval = {
  id?: string;
  description: string;
  stage?: SdlcStage;
  requiresModel?: boolean;
  agent: EvalAgent;
  cwd?: string;
  test: (context: EvalTestContext) => Promise<void>;
};

export type DefinedEvalHandle = DefinedEval & {
  id: string;
  run: () => Promise<EvalCaseResult>;
};

function slugify(description: string): string {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || "eval";
}

function createTestContext(options: {
  agent: EvalAgent;
  cwd?: string;
}): {
  context: EvalTestContext;
  collectResults: () => GraderResult[];
  readOutcome: () => {
    prompt: string;
    status: string;
    reply: string;
    completedToolCalls: NormalizedToolCall[];
    messages: Awaited<ReturnType<typeof runLocalAgent>>["messages"];
    runId?: string;
  };
} {
  const assertions: GraderResult[] = [];
  let prompt = "";
  let status = "";
  let reply = "";
  let completedToolCalls: NormalizedToolCall[] = [];
  let messages: Awaited<ReturnType<typeof runLocalAgent>>["messages"] = [];
  let runId: string | undefined;

  const context: EvalTestContext = {
    reply: "",
    status: "",
    completedToolCalls: [],
    async send(userMessage: string) {
      const runInput = await options.agent.send(userMessage);
      prompt = runInput.prompt;
      const outcome = await runLocalAgent({
        prompt: runInput.prompt,
        customTools: runInput.customTools,
        cwd: runInput.cwd ?? options.cwd
      });
      status = outcome.result.status;
      reply = outcome.result.result ?? "";
      completedToolCalls = outcome.completedToolCalls;
      messages = outcome.messages;
      runId = outcome.result.id;
      context.reply = reply;
      context.status = status;
      context.completedToolCalls = completedToolCalls;
    },
    completed() {
      assertions.push({
        grader: "completed",
        pass: status === "finished",
        message:
          status === "finished"
            ? undefined
            : `Expected status finished, got ${status || "unknown"}`
      });
    },
    calledTool(toolName: string) {
      const observed = completedToolCalls.some((call) => call.name === toolName);
      assertions.push({
        grader: `called-tool:${toolName}`,
        pass: observed,
        message: observed ? undefined : `Expected tool ${toolName} to be called`
      });
    },
    check(value: string, matcher: ExpectMatcher) {
      assertions.push(matcher.check(value));
    }
  };

  return {
    context,
    collectResults: () => assertions,
    readOutcome: () => ({
      prompt,
      status,
      reply,
      completedToolCalls,
      messages,
      runId
    })
  };
}

export async function runDefinedEval(def: DefinedEval): Promise<EvalCaseResult> {
  if (def.requiresModel !== false) {
    requireLlmEvals();
  }

  const caseId = def.id ?? slugify(def.description);
  const startedAt = new Date().toISOString();
  const ctx = prepareWorkspace();
  const workspaceBefore = captureWorkspaceSnapshot(ctx.workspaceDir);

  try {
    const { context, collectResults, readOutcome } = createTestContext({
      agent: def.agent,
      cwd: def.cwd ?? ctx.workspaceDir
    });

    await def.test(context);

    const outcome = readOutcome();
    const workspaceAfter = finalizeWorkspaceSnapshot(workspaceBefore);
    const finishedAt = new Date().toISOString();

    const evidence = buildRunEvidence({
      evalCase: {
        id: caseId,
        stage: def.stage ?? "test",
        requiresModel: def.requiresModel !== false,
        harness: "cursor-sdk",
        description: def.description,
        graders: [],
        async run() {
          const runInput = await def.agent.send("");
          return runInput;
        }
      },
      outcome: {
        result: {
          id: outcome.runId,
          status: outcome.status,
          result: outcome.reply
        } as Awaited<ReturnType<typeof runLocalAgent>>["result"],
        messages: outcome.messages,
        completedToolCalls: outcome.completedToolCalls
      },
      workspace: workspaceAfter,
      startedAt,
      finishedAt,
      ctx
    });
    evidence.prompt = outcome.prompt;

    const graderResults = collectResults();
    const result: EvalCaseResult = {
      caseId,
      pass: graderResults.every((entry) => entry.pass),
      evidence,
      graderResults
    };
    result.artifactPath = writeFailureArtifact(result);
    return result;
  } finally {
    cleanupWorkspace(ctx);
  }
}

export function defineEval(def: DefinedEval): DefinedEvalHandle {
  const id = def.id ?? slugify(def.description);
  return {
    ...def,
    id,
    run: () => runDefinedEval({ ...def, id })
  };
}
