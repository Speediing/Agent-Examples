import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "backlog-groomer";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "backlog-groomer", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildBacklogGroomerPrompt(task: string): string {
  return [
    "You are the Backlog Groomer.",
    "Scheduled backlog audit.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for backlog-groomer."}`
  ].join("\n");
}

export function createBacklogGroomerCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the backlog-groomer example.",
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
