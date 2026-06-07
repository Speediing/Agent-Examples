import { describe, expect, it } from "vitest";
import { buildHelloWorldPrompt } from "../../examples/hello-world/ts/src/agent.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";

describe.skipIf(!llmEvalsEnabled())("tier1 hello-world", () => {
  it("mentions the name and Cursor SDK in the final answer", async () => {
    requireLlmEvals();
    const prompt = buildHelloWorldPrompt("Ada");
    const streamOutcome = await runLocalAgent({ prompt });
    const smoke = await runPromptSmoke({ prompt });

    expect(streamOutcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");

    const answer = (streamOutcome.result.result ?? "").toLowerCase();
    expect(answer).toContain("ada");
    expect(answer).toContain("cursor sdk");
    expect((smoke.result ?? "").toLowerCase()).toContain("ada");
  }, 120_000);
});
