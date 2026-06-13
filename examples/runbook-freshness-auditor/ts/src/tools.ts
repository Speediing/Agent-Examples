import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "runbook-freshness-auditor";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "runbook-stale", kind: "runbook", summary: "checkout rollback runbook references removed service" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildRunbookFreshnessAuditorPrompt(task: string): string {
  return [
    "You are the Runbook Freshness Auditor.",
    "Runbook audit.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for runbook-freshness-auditor."}`
  ].join("\n");
}

export function createRunbookFreshnessAuditorCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the runbook-freshness-auditor example.",
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
