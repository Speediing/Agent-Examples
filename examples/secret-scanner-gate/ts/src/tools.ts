import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "secret/aws-access-key", path: "src/config.ts", summary: "AWS access key pattern introduced in diff" }
    ],
    count: 1,
    passed: false
  };
}

export function buildSecretScannerGatePrompt(task: string): string {
  return [
    "You are the Secret Scanner Gate.",
    "Secret scan gate.",
    "Call scan_target and cite violation ids from the tool result.",
    `Task: ${task || "Scan the sample input for secret-scanner-gate."}`
  ].join("\n");
}

export function createSecretScannerGateCustomTools() {
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
