import type { SDKJsonValue } from "@cursor/sdk";

const SIGNALS: Record<string, { status: string; evidence: string[] }> = {
  "log-anomaly-investigator": { status: "investigating", evidence: ["signal-a", "signal-b"] }
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSignals(args: { subject?: SDKJsonValue }) {
  const subject = readString(args.subject) || "log-anomaly-investigator";
  const signal = SIGNALS[subject] ?? SIGNALS["log-anomaly-investigator"];
  return { subject, found: true, signal, known_subjects: Object.keys(SIGNALS) };
}

export function buildLogAnomalyInvestigatorPrompt(task: string): string {
  return [
    "You are the Log Anomaly Investigator.",
    "Log investigation gate.",
    "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
    `Incident or subject: ${task || "log-anomaly-investigator investigation"}`
  ].join("\n");
}

export function createLogAnomalyInvestigatorCustomTools() {
  return {
    get_signals: {
      description: "Return mock investigation signals for the log-anomaly-investigator example.",
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
