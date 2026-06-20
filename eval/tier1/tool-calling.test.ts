import { describe, expect, it } from "vitest";
import { toolCallingAddCase, toolCallingWordCountCase } from "../cases/index.js";
import { llmCasesEnabled } from "../lib/runner.js";
import { runEvalCase } from "../lib/runner.js";
import {
  buildToolCallingPrompt,
  createToolCallingCustomTools
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import { runPromptSmoke } from "../lib/run-agent.js";

describe.skipIf(!llmCasesEnabled())("model evals tool-calling-agent", () => {
  it("calls add with [3, 9] and grounds the answer in the handler result", async () => {
    const result = await runEvalCase(toolCallingAddCase);
    expect(result.pass).toBe(true);
    if (!result.pass) {
      console.error(result.graderResults);
    }

    const prompt = buildToolCallingPrompt("add 3 and 9");
    const customTools = createToolCallingCustomTools();
    const smoke = await runPromptSmoke({ prompt, customTools });
    expect(smoke.status).toBe("finished");
  }, 120_000);

  it("calls word_count for the default request and grounds the count in the handler result", async () => {
    const result = await runEvalCase(toolCallingWordCountCase);
    expect(result.pass).toBe(true);
    if (!result.pass) {
      console.error(result.graderResults);
    }
  }, 120_000);
});
