import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "prior-art-finder";
  return {
    query,
    found: true,
    facts: [
      { key: "module", value: "src/payments/refund.ts" },
      { key: "related_adr", value: "docs/adr/014-refund-flow.md" }
    ],
    count: 2
  };
}

export function buildPriorArtFinderPrompt(task: string): string {
  return [
    "You are the Prior Art Finder.",
    "Prior art search.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the prior-art-finder example."}`
  ].join("\n");
}

export function createPriorArtFinderCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the prior-art-finder example.",
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
