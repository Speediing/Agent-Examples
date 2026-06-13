import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "test/missing-coverage", path: "src/payments/refund.ts", summary: "Application code changed without matching test file" }
    ],
    count: 1,
    passed: false
  };
}

export function buildTestPresenceGatePrompt(task: string): string {
  return [
    "You are the Test Presence Gate.",
    "Test presence gate.",
    "Call scan_target and cite violation ids from the tool result.",
    `Task: ${task || "Scan the sample input for test-presence-gate."}`
  ].join("\n");
}

export function createTestPresenceGateCustomTools() {
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
