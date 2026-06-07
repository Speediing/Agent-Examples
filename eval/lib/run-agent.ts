import { Agent, type RunResult, type SDKCustomTool, type SDKMessage } from "@cursor/sdk";
import { evalConfig } from "./config.js";
import { dedupeCompletedToolCalls, type NormalizedToolCall } from "./trace.js";

export type AgentRunOutcome = {
  result: RunResult;
  messages: SDKMessage[];
  completedToolCalls: NormalizedToolCall[];
};

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
    for await (const message of run.stream()) {
      messages.push(message);
    }

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
