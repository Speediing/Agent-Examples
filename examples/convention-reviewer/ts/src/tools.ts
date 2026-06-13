import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "style/no-default-export", path: "src/components/Checkout.tsx", summary: "Default export in components/ violates house style" }
    ],
    count: 1,
    passed: false
  };
}

export function buildConventionReviewerPrompt(task: string): string {
  return [
    "You are the Convention Reviewer.",
    "Style scan gate.",
    "Call scan_target and cite violation ids from the tool result.",
    `Task: ${task || "Scan the sample input for convention-reviewer."}`
  ].join("\n");
}

export function createConventionReviewerCustomTools() {
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
