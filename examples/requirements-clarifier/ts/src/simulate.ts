import { Agent } from "@cursor/sdk";
import { approve, createApprovalState, reject } from "./gate.js";
import { buildRequirementsClarifierPrompt } from "./agent.js";
import { createRecord } from "./tools.js";

export async function simulateRequirementsClarifierChat(thread: { text: string; action?: "approve" | "reject" }, options: { apiKey?: string; model?: string; skipSdk?: boolean } = {}) {
  const approval = createApprovalState();
  const prompt = buildRequirementsClarifierPrompt(thread.text);
  let plan = "Summary: example triage plan for requirements-clarifier.";
  if (!options.skipSdk && options.apiKey && options.model) {
    const result = await Agent.prompt(prompt, { apiKey: options.apiKey, model: { id: options.model }, local: { cwd: process.cwd() } });
    plan = result.result ?? plan;
  }
  if (thread.action === "approve") approve(approval);
  if (thread.action === "reject") reject(approval);
  const record = createRecord({ plan, approval });
  return { plan, approval, record };
}
