import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "snapshot/ui-regression", path: "src/checkout/__snapshots__/page.test.tsx.snap", summary: "Snapshot diff exceeds allowed pixel threshold" }
    ],
    count: 1,
    passed: false
  };
}

export function buildSnapshotReviewerPrompt(task: string): string {
  return [
    "You are the Snapshot Reviewer.",
    "Snapshot scan.",
    "Call scan_target and cite violation ids from the tool result.",
    `Task: ${task || "Scan the sample input for snapshot-reviewer."}`
  ].join("\n");
}

export function createSnapshotReviewerCustomTools() {
  return {
    scan_target: {
      description: "Scan the target input and return structured violations.",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "Path, diff snippet, or label to scan" }
        }
      },
      execute: (args: { target?: SDKJsonValue }) => scanTarget(args)
    }
  };
}
