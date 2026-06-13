import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "dependency-updater";
  return {
    scope,
    drift_detected: true,
    actionable: [
      {
        id: "dep-lodash-421",
        kind: "dependency",
        summary: "lodash 4.17.20 → 4.17.21 security patch available"
      },
      {
        id: "lockfile-drift",
        kind: "lockfile",
        summary: "package-lock.json behind registry for axios 1.7.2"
      },
      {
        id: "semver-bump",
        kind: "release",
        summary: "conventional commits since v2.3.0 suggest minor bump to v2.4.0"
      }
    ],
    count: 3,
    writes_enabled: process.argv.includes("--act")
  };
}

export function buildDependencyUpdaterPrompt(task: string): string {
  return [
    "You are the Dependency Updater.",
    "Dependency audit then act.",
    "Call audit_state first. Cover dependency bumps, lockfile drift, and semver impact.",
    "Only recommend writes when audit_state.writes_enabled is true.",
    `Task: ${task || "Audit scope for dependency-updater."}`
  ].join("\n");
}

export function createDependencyUpdaterCustomTools() {
  return {
    audit_state: {
      description:
        "Return dependency, lockfile drift, and semver audit records for the dependency-updater example.",
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
