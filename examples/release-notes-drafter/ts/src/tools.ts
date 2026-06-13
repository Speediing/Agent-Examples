import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadJson<T>(fileName: string): T {
  const raw = fs.readFileSync(path.join(exampleRoot, "fixtures", fileName), "utf8");
  return JSON.parse(raw) as T;
}

export function listReleaseInputs(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope).toLowerCase();
  if (scope.includes("on-call") || scope.includes("alert") || scope.includes("overnight")) {
    const digest = loadJson<{ window: string; alerts: SDKJsonValue[] }>("oncall-alerts.json");
    return {
      mode: "on_call_digest",
      window: digest.window,
      since_tag: "",
      until_tag: "",
      items: digest.alerts,
      count: digest.alerts.length,
    };
  }
  const release = loadJson<{
    since_tag: string;
    until_tag: string;
    merged_prs: SDKJsonValue[];
  }>("merged-prs.json");
  return {
    mode: "release_notes",
    window: "",
    since_tag: release.since_tag,
    until_tag: release.until_tag,
    items: release.merged_prs,
    count: release.merged_prs.length,
  };
}

export function buildReleaseNotesDrafterPrompt(task: string): string {
  return [
    "You are the Release Notes Drafter.",
    "Scheduled digest writer.",
    "Call list_release_inputs first. Cite PR numbers or alert ids from tool output only.",
    `Task: ${task || "Draft release notes or an on-call digest from fixture inputs."}`,
  ].join("\n");
}

export function createReleaseNotesDrafterCustomTools() {
  return {
    list_release_inputs: {
      description:
        "Load merged PRs for release notes or overnight alerts for an on-call digest from committed fixtures.",
      inputSchema: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            description: "Release tag range (e.g. v2.4.0) or on-call/overnight digest scope",
          },
        },
      },
      execute: (args: { scope?: SDKJsonValue }) => listReleaseInputs(args),
    },
  };
}
