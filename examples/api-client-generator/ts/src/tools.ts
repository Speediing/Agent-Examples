import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "api-client-generator";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "openapi-payments", kind: "openapi", summary: "payments.yaml drift: new RefundStatus enum" }],
    count: 1,
    writes_enabled: process.argv.includes('--act')
  };
}

export function buildApiClientGeneratorPrompt(task: string): string {
  return [
    "You are the API Client Generator.",
    "OpenAPI drift repair.",
    "Call audit_state first. Only recommend writes when audit_state.writes_enabled is true.",
    `Task: ${task || "Audit scope for api-client-generator."}`
  ].join("\n");
}

export function createApiClientGeneratorCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the api-client-generator example.",
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
