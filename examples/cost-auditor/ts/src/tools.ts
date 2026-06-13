import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "cost-auditor";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "cost-ec2-spike", kind: "cost", summary: "EC2 spend +34% week-over-week in us-east-1" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildCostAuditorPrompt(task: string): string {
  return [
    "You are the Cost Auditor.",
    "Cost audit.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for cost-auditor."}`
  ].join("\n");
}

export function createCostAuditorCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the cost-auditor example.",
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
