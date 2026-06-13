import type { SDKJsonValue } from "@cursor/sdk";

const SIGNALS: Record<string, { status: string; evidence: string[] }> = {
  "security-review-agent": { status: "investigating", evidence: ["signal-a", "signal-b"] }
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSignals(args: { subject?: SDKJsonValue }) {
  const subject = readString(args.subject) || "security-review-agent";
  const signal = SIGNALS[subject] ?? SIGNALS["security-review-agent"];
  return { subject, found: true, signal, known_subjects: Object.keys(SIGNALS) };
}

export function buildSecurityReviewAgentPrompt(task: string): string {
  return [
    "You are the Security Review Agent.",
    "Security investigation gate.",
    "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
    `Incident or subject: ${task || "security-review-agent investigation"}`
  ].join("\n");
}

export function createSecurityReviewAgentCustomTools() {
  return {
    get_signals: {
      description: "Return mock investigation signals for the security-review-agent example.",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Service, diff, or incident label" }
        }
      },
      execute: (args: { subject?: SDKJsonValue }) => getSignals(args)
    }
  };
}
