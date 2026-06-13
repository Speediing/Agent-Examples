import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "convention-fixer-rule-1", impact: "moderate", summary: "Example violation for convention-fixer" }
    ],
    count: 1,
    passed: false
  };
}

export function buildConventionFixerPrompt(task: string): string {
  return [
    "You are the Convention Fixer.",
    "Scan-fix-rescan for style.",
    "Call scan_target and cite violation ids from the tool result.",
    `Task: ${task || "Scan the sample input for convention-fixer."}`
  ].join("\n");
}

export function createConventionFixerCustomTools() {
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
