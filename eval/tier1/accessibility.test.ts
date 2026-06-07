import { describe, expect, it } from "vitest";
import {
  buildAccessibilityPrompt,
  createAccessibilityCustomTools
} from "../../examples/accessibility-agent/ts/src/agent.js";
import {
  defaultFixtureUrl,
  scanAccessibility
} from "../../examples/accessibility-agent/ts/src/scan.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";

describe.skipIf(!llmEvalsEnabled())("tier1 accessibility-agent", () => {
  it("calls scan_accessibility and cites fixture rule IDs in the summary", async () => {
    requireLlmEvals();
    const targetUrl = defaultFixtureUrl();
    const scan = await scanAccessibility(targetUrl);
    const ruleIds = scan.violations.map((violation) => violation.id);
    expect(ruleIds.length).toBeGreaterThan(0);

    const prompt = buildAccessibilityPrompt(targetUrl, "");
    const customTools = createAccessibilityCustomTools(targetUrl);
    const outcome = await runLocalAgent({ prompt, customTools });
    const smoke = await runPromptSmoke({ prompt, customTools });

    expect(outcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");

    const scanCalls = outcome.completedToolCalls.filter(
      (call) => call.name === "scan_accessibility"
    );
    expect(scanCalls.length).toBeGreaterThan(0);

    const answer = (outcome.result.result ?? "").toLowerCase();
    const citedRule = ruleIds.find((ruleId) =>
      answer.includes(ruleId.toLowerCase())
    );
    expect(citedRule).toBeTruthy();
  }, 180_000);
});
