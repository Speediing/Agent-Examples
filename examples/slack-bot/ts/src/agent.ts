import type { TriagePlan } from "./gate.js";

export function buildTriagePrompt(threadText: string): string {
  const report = threadText.trim() || "Checkout returns 503 after deploy. Users cannot pay.";

  return [
    "You are the Slack Bug Triage Agent.",
    "Turn the Slack thread into a short triage plan a human can approve.",
    "Do not claim you created a ticket or opened a pull request.",
    "Return markdown with these sections:",
    "1. Summary",
    "2. Likely impact",
    "3. Proposed next steps",
    "4. What needs human approval",
    `Slack thread:\n${report}`
  ].join("\n");
}

export function buildTicketTitle(planText: string): string {
  const firstLine =
    planText
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "Bug report from Slack";

  return firstLine.replace(/^#+\s*/, "").slice(0, 120);
}

export function parseTriagePlan(planText: string): TriagePlan {
  const lines = planText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const steps = lines
    .filter((line) => /^(\d+\.|[-*])/.test(line))
    .map((line) => line.replace(/^(\d+\.|[-*])\s*/, ""));

  return {
    summary: lines[0] ?? "Bug report triage plan",
    steps: steps.length > 0 ? steps : ["Investigate the reported issue."],
    ticketTitle: buildTicketTitle(planText)
  };
}
