import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "fixture-freshness-auditor";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "fixture-freshness-auditor", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildFixtureFreshnessAuditorPrompt(task: string): string {
  return [
    "You are the Fixture Freshness Auditor.",
    "Fixture freshness audit.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for fixture-freshness-auditor."}`
  ].join("\n");
}

export function createFixtureFreshnessAuditorCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the fixture-freshness-auditor example.",
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
