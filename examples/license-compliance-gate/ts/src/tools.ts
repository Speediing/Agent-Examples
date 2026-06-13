import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "license-compliance-gate";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "license-gpl", kind: "license", summary: "axios 1.7.0 introduces GPL-3.0 transitive dependency" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildLicenseComplianceGatePrompt(task: string): string {
  return [
    "You are the License Compliance Gate.",
    "License audit gate.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for license-compliance-gate."}`
  ].join("\n");
}

export function createLicenseComplianceGateCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the license-compliance-gate example.",
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
