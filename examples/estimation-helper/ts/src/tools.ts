import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "estimation-helper";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "estimation-helper" },
      { key: "lesson", value: "Estimation with file evidence" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function buildEstimationHelperPrompt(task: string): string {
  return [
    "You are the Estimation Helper.",
    "Estimation with file evidence.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the estimation-helper example."}`
  ].join("\n");
}

export function createEstimationHelperCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the estimation-helper example.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Short task or topic string" }
        }
      },
      execute: (args: { query?: SDKJsonValue }) => lookupContext(args)
    }
  };
}
