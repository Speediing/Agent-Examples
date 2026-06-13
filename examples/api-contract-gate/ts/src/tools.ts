import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "openapi/removed-endpoint", path: "openapi/payments.yaml", summary: "GET /v1/refunds removed without deprecation window" }
    ],
    count: 1,
    passed: false
  };
}

export function buildApiContractGatePrompt(task: string): string {
  return [
    "You are the API Contract Gate.",
    "Contract scan gate.",
    "Call scan_target and cite violation ids from the tool result.",
    `Task: ${task || "Scan the sample input for api-contract-gate."}`
  ].join("\n");
}

export function createApiContractGateCustomTools() {
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
