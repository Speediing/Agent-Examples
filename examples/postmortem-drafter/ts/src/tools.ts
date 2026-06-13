import type { SDKJsonValue } from "@cursor/sdk";

const SIGNALS: Record<string, { status: string; evidence: string[] }> = {
  "postmortem-drafter": { status: "investigating", evidence: ["signal-a", "signal-b"] }
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSignals(args: { subject?: SDKJsonValue }) {
  const subject = readString(args.subject) || "postmortem-drafter";
  const signal = SIGNALS[subject] ?? SIGNALS["postmortem-drafter"];
  return { subject, found: true, signal, known_subjects: Object.keys(SIGNALS) };
}

export function buildPostmortemDrafterPrompt(task: string): string {
  return [
    "You are the Postmortem Drafter.",
    "Postmortem writer.",
    "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
    `Incident or subject: ${task || "postmortem-drafter investigation"}`
  ].join("\n");
}

export function createPostmortemDrafterCustomTools() {
  return {
    get_signals: {
      description: "Return mock investigation signals for the postmortem-drafter example.",
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
