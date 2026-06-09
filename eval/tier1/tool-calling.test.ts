import { describe, expect, it } from "vitest";
import {
  addNumbers,
  buildToolCallingPrompt,
  countWords,
  createToolCallingCustomTools
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";
import { numbersMultiset } from "../lib/trace.js";

const ALLOWED_TOOLS = new Set(["add", "word_count"]);

describe.skipIf(!llmEvalsEnabled())("tier1 tool-calling-agent", () => {
  it("calls add with [3, 9] and grounds the answer in the handler result", async () => {
    requireLlmEvals();
    const prompt = buildToolCallingPrompt("add 3 and 9");
    const customTools = createToolCallingCustomTools();
    const outcome = await runLocalAgent({ prompt, customTools });
    const smoke = await runPromptSmoke({ prompt, customTools });

    expect(outcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");

    for (const call of outcome.completedToolCalls) {
      expect(ALLOWED_TOOLS.has(call.name)).toBe(true);
    }

    const addCall = outcome.completedToolCalls.find((call) => call.name === "add");
    expect(addCall).toBeTruthy();
    expect(numbersMultiset(addCall!.args).sort()).toEqual([3, 9]);

    const expected = addNumbers({ numbers: [3, 9] });
    const answer = outcome.result.result ?? "";
    expect(answer).toMatch(/12/);
    expect(answer).toContain(String(expected.total));
  }, 120_000);

  it("calls word_count for the default request and grounds the count in the handler result", async () => {
    requireLlmEvals();
    const prompt = buildToolCallingPrompt("");
    const customTools = createToolCallingCustomTools();
    const outcome = await runLocalAgent({ prompt, customTools });

    expect(outcome.result.status).toBe("finished");

    for (const call of outcome.completedToolCalls) {
      expect(ALLOWED_TOOLS.has(call.name)).toBe(true);
    }

    const wordCountCall = outcome.completedToolCalls.find(
      (call) => call.name === "word_count"
    );
    expect(wordCountCall).toBeTruthy();

    const expected = countWords(
      wordCountCall!.args as { text?: string }
    );
    const answer = outcome.result.result ?? "";
    expect(answer).toContain(String(expected.count));
  }, 120_000);
});
