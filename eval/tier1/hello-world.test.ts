import { describe, expect, it } from "vitest";
import { buildInventoryPrompt } from "../../examples/hello-world/ts/src/agent.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";

describe.skipIf(!llmEvalsEnabled())("model evals hello-world inventory", () => {
  it("submits an inventory prompt that names assessment.md", async () => {
    requireLlmEvals();
    const prompt = buildInventoryPrompt();
    const streamOutcome = await runLocalAgent({ prompt });
    const smoke = await runPromptSmoke({ prompt });

    expect(streamOutcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");
    expect(prompt.toLowerCase()).toContain("assessment.md");
  }, 120_000);
});
