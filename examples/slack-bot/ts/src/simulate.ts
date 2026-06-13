import { Agent } from "@cursor/sdk";
import {
  approve,
  createApprovalState,
  reject,
  type ApprovalState
} from "./gate.js";
import { buildTriagePrompt } from "./agent.js";
import { createTicket, openPr } from "./tools.js";

export type SimulatedThread = {
  text: string;
  action?: "approve" | "reject";
};

export type SimulationResult = {
  plan: string;
  approval: ApprovalState;
  ticket: ReturnType<typeof createTicket>;
  pr: ReturnType<typeof openPr>;
};

export async function simulateSlackTriage(
  thread: SimulatedThread,
  options: {
    apiKey?: string;
    model?: string;
    skipSdk?: boolean;
  } = {}
): Promise<SimulationResult> {
  const approval = createApprovalState();
  const prompt = buildTriagePrompt(thread.text);
  let plan = [
    "Summary: Checkout errors after deploy.",
    "Likely impact: payments blocked.",
    "Proposed next steps:",
    "1. Check recent deploy for checkout-api.",
    "2. Roll back if error rate is still elevated.",
    "What needs human approval: ticket creation and any remediation PR."
  ].join("\n");

  if (!options.skipSdk && options.apiKey && options.model) {
    const result = await Agent.prompt(prompt, {
      apiKey: options.apiKey,
      model: { id: options.model },
      local: { cwd: process.cwd() }
    });
    plan = result.result ?? plan;
  }

  if (thread.action === "approve") {
    approve(approval);
  } else if (thread.action === "reject") {
    reject(approval);
  }

  const ticket = createTicket({ plan, approval });
  const pr = openPr({ plan, repo: "platform/checkout", approval });

  return {
    plan,
    approval,
    ticket,
    pr
  };
}
