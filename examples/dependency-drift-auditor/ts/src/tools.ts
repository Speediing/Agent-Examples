import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "dependency-drift-auditor";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "dependency-drift-auditor", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildDependencyDriftAuditorPrompt(task: string): string {
  return [
    "You are the Dependency Drift Auditor.",
    "Lockfile drift audit.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for dependency-drift-auditor."}`
  ].join("\n");
}

export function createDependencyDriftAuditorCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the dependency-drift-auditor example.",
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
