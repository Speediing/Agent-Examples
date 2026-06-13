import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "flake-hunter";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "flake-payments-int", kind: "flake", summary: "payments.integration.test.ts failed 3/10 recent runs" }],
    count: 1,
    writes_enabled: false
  };
}

export function buildFlakeHunterPrompt(task: string): string {
  return [
    "You are the Flake Hunter.",
    "Flake audit.",
    "Call audit_state first. This example is audit-only.",
    `Task: ${task || "Audit scope for flake-hunter."}`
  ].join("\n");
}

export function createFlakeHunterCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the flake-hunter example.",
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
