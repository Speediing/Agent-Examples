import { describe, expect, it } from "vitest";
import { sreCheckout503Case } from "../cases/index.js";
import { llmCasesEnabled } from "../lib/runner.js";
import { runEvalCase } from "../lib/runner.js";
import {
  buildSrePrompt,
  createSreCustomTools
} from "../../examples/sre-agent/ts/src/tools.js";
import { runPromptSmoke } from "../lib/run-agent.js";

describe.skipIf(!llmCasesEnabled())("model evals sre-agent", () => {
  it("uses the causal tool core and grounds the report in tool results", async () => {
    const result = await runEvalCase(sreCheckout503Case);
    expect(result.pass).toBe(true);
    if (!result.pass) {
      console.error(result.graderResults);
    }

    const incident = "checkout-api returning 503 after deploy";
    const prompt = buildSrePrompt(incident);
    const customTools = createSreCustomTools();
    const smoke = await runPromptSmoke({ prompt, customTools });
    expect(smoke.status).toBe("finished");
  }, 180_000);
});
