import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "test-coverage-agent";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "test-coverage-agent" },
      { key: "lesson", value: "Coverage gap finder" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function buildTestCoverageAgentPrompt(task: string): string {
  return [
    "You are the Test Coverage Agent.",
    "Coverage gap finder.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the test-coverage-agent example."}`
  ].join("\n");
}

export function createTestCoverageAgentCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the test-coverage-agent example.",
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
