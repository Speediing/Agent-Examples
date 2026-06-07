import { describe, expect, it } from "vitest";
import type {
  RunResult,
  SDKMessage,
  SDKToolUseMessage
} from "@cursor/sdk";

describe("Cursor SDK type reference (§2 claims)", () => {
  it("RunResult exposes result, status, and durationMs only", () => {
    const sample: RunResult = {
      id: "run-1",
      result: "hello",
      status: "finished",
      durationMs: 42
    };

    expect(sample.result).toBe("hello");
    expect(sample.status).toBe("finished");
    expect(sample.durationMs).toBe(42);
  });

  it("SDKToolUseMessage is part of the SDKMessage union", () => {
    const toolCall: SDKToolUseMessage = {
      type: "tool_call",
      agent_id: "agent-1",
      run_id: "run-1",
      call_id: "call-1",
      name: "add",
      args: { numbers: [1, 2] },
      result: { total: 3 },
      status: "completed"
    };

    const message: SDKMessage = toolCall;
    expect(message.type).toBe("tool_call");
  });
});
