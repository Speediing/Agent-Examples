import type { SDKJsonValue } from "@cursor/sdk";

const SIGNALS: Record<string, { status: string; evidence: string[] }> = {
  "rollout-watcher": { status: "investigating", evidence: ["signal-a", "signal-b"] }
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSignals(args: { subject?: SDKJsonValue }) {
  const subject = readString(args.subject) || "rollout-watcher";
  const signal = SIGNALS[subject] ?? SIGNALS["rollout-watcher"];
  return { subject, found: true, signal, known_subjects: Object.keys(SIGNALS) };
}

export function buildRolloutWatcherPrompt(task: string): string {
  return [
    "You are the Rollout Watcher.",
    "Deploy investigation gate.",
    "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
    `Incident or subject: ${task || "rollout-watcher investigation"}`
  ].join("\n");
}

export function createRolloutWatcherCustomTools() {
  return {
    get_signals: {
      description: "Return mock investigation signals for the rollout-watcher example.",
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
