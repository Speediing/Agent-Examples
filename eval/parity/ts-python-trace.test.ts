import { describe, expect, it } from "vitest";
import {
  buildToolCallingPrompt,
  createToolCallingCustomTools
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent } from "../lib/run-agent.js";

describe.skipIf(!llmEvalsEnabled())("ts↔python trace-shape parity (advisory)", () => {
  it("typescript tool-calling uses the add tool for a sum request", async () => {
    requireLlmEvals();
    const prompt = buildToolCallingPrompt("add 3 and 9");
    const outcome = await runLocalAgent({
      prompt,
      customTools: createToolCallingCustomTools()
    });

    const toolNames = outcome.completedToolCalls.map((call) => call.name);
    expect(toolNames).toContain("add");
  }, 120_000);
});
