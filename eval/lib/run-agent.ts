import {
  Agent,
  type Run,
  type RunResult,
  type SDKCustomTool,
  type SDKMessage
} from "@cursor/sdk";
import { evalConfig } from "./config.js";
import { dedupeCompletedToolCalls, type NormalizedToolCall } from "./trace.js";

export type AgentRunOutcome = {
  result: RunResult;
  messages: SDKMessage[];
  completedToolCalls: NormalizedToolCall[];
};

async function cancelRunIfSupported(run: Run): Promise<void> {
  if (run.supports("cancel")) {
    await run.cancel();
  }
}

async function collectStreamWithCostCaps(
  run: Run,
  messages: SDKMessage[]
): Promise<void> {
  const startedAt = Date.now();
  const seenToolCallIds = new Set<string>();
  let toolCallCount = 0;
  const iterator = run.stream()[Symbol.asyncIterator]();

  while (true) {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= evalConfig.maxWallClockMsPerCase) {
      await cancelRunIfSupported(run);
      return;
    }

    const remainingMs = evalConfig.maxWallClockMsPerCase - elapsed;
    const raced = await Promise.race([
      iterator.next().then((result) => ({ kind: "next" as const, result })),
      new Promise<{ kind: "timeout" }>((resolve) =>
        setTimeout(() => resolve({ kind: "timeout" }), remainingMs)
      )
    ]);

    if (raced.kind === "timeout") {
      await cancelRunIfSupported(run);
      return;
    }

    if (raced.result.done) {
      return;
    }

    const message = raced.result.value;
    messages.push(message);

    if (message.type === "tool_call" && !seenToolCallIds.has(message.call_id)) {
      seenToolCallIds.add(message.call_id);
      toolCallCount += 1;
      if (toolCallCount > evalConfig.maxToolCallsPerCase) {
        await cancelRunIfSupported(run);
        return;
      }
    }
  }
}

export async function runLocalAgent(options: {
  prompt: string;
  customTools?: Record<string, SDKCustomTool>;
  cwd?: string;
}): Promise<AgentRunOutcome> {
  const agent = await Agent.create({
    apiKey: evalConfig.apiKey,
    model: { id: evalConfig.modelId },
    local: {
      cwd: options.cwd ?? process.cwd(),
      customTools: options.customTools
    }
  });

  try {
    const run = await agent.send(options.prompt);

    if (!run.supports("stream")) {
      throw new Error(
        `Run ${run.id} does not support stream(): ${run.unsupportedReason("stream") ?? "unknown"}`
      );
    }

    const messages: SDKMessage[] = [];
    await collectStreamWithCostCaps(run, messages);

    const result = await run.wait();

    return {
      result,
      messages,
      completedToolCalls: dedupeCompletedToolCalls(messages)
    };
  } finally {
    agent.close();
  }
}

export async function runPromptSmoke(options: {
  prompt: string;
  customTools?: Record<string, SDKCustomTool>;
  cwd?: string;
}): Promise<RunResult> {
  return Agent.prompt(options.prompt, {
    apiKey: evalConfig.apiKey,
    model: { id: evalConfig.modelId },
    local: {
      cwd: options.cwd ?? process.cwd(),
      customTools: options.customTools
    }
  });
}
