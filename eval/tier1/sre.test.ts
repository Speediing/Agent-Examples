import { describe, expect, it } from "vitest";
import {
  buildSrePrompt,
  createSreCustomTools,
  getAlerts,
  getErrorLogs,
  getRecentDeployments,
  getServiceHealth
} from "../../examples/sre-agent/ts/src/tools.js";
import {
  assertReadOnlyContract,
  collectGroundingValues,
  findNovelGroundingCitation
} from "../lib/grounding.js";
import { llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";

const HANDLERS: Record<
  string,
  (args: Record<string, unknown>) => unknown
> = {
  get_service_health: getServiceHealth,
  get_recent_deployments: getRecentDeployments,
  get_alerts: getAlerts,
  get_error_logs: getErrorLogs
};

describe.skipIf(!llmEvalsEnabled())("tier1 sre-agent", () => {
  it("uses the causal tool core and grounds the report in tool results", async () => {
    requireLlmEvals();
    const incident = "checkout-api returning 503 after deploy";
    const prompt = buildSrePrompt(incident);
    const customTools = createSreCustomTools();
    const outcome = await runLocalAgent({ prompt, customTools });
    const smoke = await runPromptSmoke({ prompt, customTools });

    expect(outcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");

    const toolNames = outcome.completedToolCalls.map((call) => call.name);
    expect(toolNames).toContain("get_service_health");
    expect(toolNames).toContain("get_recent_deployments");
    expect(
      toolNames.includes("get_error_logs") || toolNames.includes("get_alerts")
    ).toBe(true);

    const recomputed = outcome.completedToolCalls
      .filter((call) => call.name in HANDLERS)
      .map((call) => HANDLERS[call.name]!(call.args));

    const groundingValues = collectGroundingValues(recomputed);
    const answer = outcome.result.result ?? "";
    const citation = findNovelGroundingCitation(answer, groundingValues, prompt);
    expect(citation).toBeTruthy();
    assertReadOnlyContract(answer);
  }, 180_000);
});
