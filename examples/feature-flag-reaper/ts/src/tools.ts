import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "feature-flag-reaper";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "feature-flag-reaper", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: process.argv.includes('--act')
  };
}

export function buildFeatureFlagReaperPrompt(task: string): string {
  return [
    "You are the Feature Flag Reaper.",
    "Flag cleanup audit.",
    "Call audit_state first. Only recommend writes when audit_state.writes_enabled is true.",
    `Task: ${task || "Audit scope for feature-flag-reaper."}`
  ].join("\n");
}

export function createFeatureFlagReaperCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the feature-flag-reaper example.",
      inputSchema: {
        type: "object",
        properties: {
          scope: { type: "string", description: "Audit scope label" }
        }
      },
      execute: (args: { scope?: SDKJsonValue }) => auditState(args)
    }
  };
}
