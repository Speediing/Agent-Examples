import type { SDKMessage, SDKToolUseMessage } from "@cursor/sdk";

export type NormalizedToolCall = {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  status: "completed" | "running" | "error";
  truncated: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractToolName(message: SDKToolUseMessage): string {
  if (message.name === "mcp" && isRecord(message.args)) {
    const toolName = message.args.toolName;
    if (typeof toolName === "string" && toolName.length > 0) {
      return toolName;
    }
  }

  return message.name;
}

export function extractToolArgs(message: SDKToolUseMessage): Record<string, unknown> {
  if (message.name === "mcp" && isRecord(message.args) && isRecord(message.args.args)) {
    return message.args.args;
  }

  if (isRecord(message.args)) {
    return message.args;
  }

  return {};
}

export function normalizeToolCall(message: SDKToolUseMessage): NormalizedToolCall {
  return {
    callId: message.call_id,
    name: extractToolName(message),
    args: extractToolArgs(message),
    status: message.status,
    truncated: Boolean(
      message.truncated?.args || message.truncated?.result
    )
  };
}

export function dedupeCompletedToolCalls(
  messages: SDKMessage[]
): NormalizedToolCall[] {
  const byCallId = new Map<string, NormalizedToolCall>();

  for (const message of messages) {
    if (message.type !== "tool_call") {
      continue;
    }

    const normalized = normalizeToolCall(message);
    byCallId.set(normalized.callId, normalized);
  }

  return [...byCallId.values()].filter(
    (call) => call.status === "completed" && !call.truncated
  );
}

export function multisetEqual<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

export function numbersMultiset(args: Record<string, unknown>): number[] {
  const numbers = args.numbers;
  if (!Array.isArray(numbers)) {
    return [];
  }

  return numbers.filter((value): value is number => typeof value === "number");
}
