import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "codemod-runner";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "codemod-runner", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: process.argv.includes('--act')
  };
}

export function buildCodemodRunnerPrompt(task: string): string {
  return [
    "You are the Codemod Runner.",
    "Codemod audit then act.",
    "Call audit_state first. Only recommend writes when audit_state.writes_enabled is true.",
    `Task: ${task || "Audit scope for codemod-runner."}`
  ].join("\n");
}

export function createCodemodRunnerCustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the codemod-runner example.",
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
