import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "scaffolding-agent";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "scaffolding-agent" },
      { key: "lesson", value: "Gated scaffolding" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function buildScaffoldingAgentPrompt(task: string): string {
  return [
    "You are the Scaffolding Agent.",
    "Gated scaffolding.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the scaffolding-agent example."}`
  ].join("\n");
}

export function createScaffoldingAgentCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the scaffolding-agent example.",
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
