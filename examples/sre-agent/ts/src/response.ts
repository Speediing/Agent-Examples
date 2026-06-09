import type { SDKJsonValue } from "@cursor/sdk";
import {
  createPrToolState,
  mergePullRequest,
  openPullRequest,
  requestApproval,
  type PrToolState
} from "./pr-tools.js";
import { createSreCustomTools } from "./tools.js";

export function buildSreResponsePrompt(alertPayload: string): string {
  return [
    "You are an on-call SRE agent. Each user message is a PagerDuty alert payload.",
    "Triage it to root cause and ship the minimal safe fix.",
    "",
    "local.cwd contains logs/, infra/, and runbooks/ for the alerting service.",
    "Use read-only observability tools first, then read and edit files in the checkout.",
    "",
    "Workflow for every alert:",
    "1. Call observability tools and read logs/ to identify the failure signature.",
    "2. Consult lookup_runbook, then find the root cause under infra/.",
    "3. Edit the manifest in place and produce a unified diff.",
    "4. open_pull_request(title, body, diff) with the fix.",
    "5. request_approval(summary) and wait for the human decision.",
    "6. Only if the result is approved, merge_pull_request(pr_number).",
    "",
    "Never call merge_pull_request unless request_approval returned approved.",
    "Keep the fix minimal — do not refactor unrelated config.",
    alertPayload
  ].join("\n");
}

export function createSreResponseTools(state: PrToolState) {
  return {
    ...createSreCustomTools(),
    open_pull_request: {
      description:
        "Open a pull request against the infra repo with the proposed fix.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          diff: {
            type: "string",
            description: "Unified diff of the change."
          }
        },
        required: ["title", "body", "diff"]
      },
      execute: (args: {
        title?: SDKJsonValue;
        body?: SDKJsonValue;
        diff?: SDKJsonValue;
      }) => openPullRequest(state, args)
    },
    request_approval: {
      description:
        "Ask the on-call human to approve the proposed PR before merging.",
      inputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" }
        },
        required: ["summary"]
      },
      execute: (args: { summary?: SDKJsonValue }) =>
        requestApproval(state, args)
    },
    merge_pull_request: {
      description: "Merge an approved pull request.",
      inputSchema: {
        type: "object",
        properties: {
          pr_number: { type: "number" }
        },
        required: ["pr_number"]
      },
      execute: (args: { pr_number?: SDKJsonValue }) =>
        mergePullRequest(state, args)
    }
  };
}

export { createPrToolState };
