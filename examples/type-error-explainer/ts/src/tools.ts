import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "type-error-explainer";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "type-error-explainer" },
      { key: "lesson", value: "Compiler output explainer" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function buildTypeErrorExplainerPrompt(task: string): string {
  return [
    "You are the Type Error Explainer.",
    "Compiler output explainer.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the type-error-explainer example."}`
  ].join("\n");
}

export function createTypeErrorExplainerCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the type-error-explainer example.",
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
