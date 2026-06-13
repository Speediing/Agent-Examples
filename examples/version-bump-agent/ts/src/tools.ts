import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "version-bump-agent";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "version-bump-agent", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: process.argv.includes('--act')
  };
}

export function buildVersionBumpAgentPrompt(task: string): string {
  return [
    "You are the Version Bump Agent.",
    "Gated version bumps.",
    "Call audit_state first. Only recommend writes when audit_state.writes_enabled is true.",
    `Task: ${task || "Audit scope for version-bump-agent."}`
  ].join("\n");
}

export function createVersionBumpAgentCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the version-bump-agent example.",
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
