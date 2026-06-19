import { describe, expect, it } from "vitest";
import { buildTriagePrompt } from "../../examples/slack-bot/ts/src/agent.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";

describe.skipIf(!llmEvalsEnabled())("model evals slack-bot", () => {
  it("grounds the triage plan in the Slack thread text", async () => {
    requireLlmEvals();
    const prompt = buildTriagePrompt("checkout-api returns 503 after deploy");
    const outcome = await runLocalAgent({ prompt });
    const smoke = await runPromptSmoke({ prompt });

    expect(outcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");

    const answer = (outcome.result.result ?? "").toLowerCase();
    expect(answer).toMatch(/503|checkout|deploy/);
  }, 120_000);
});
