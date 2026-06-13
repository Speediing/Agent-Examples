import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "mutation-test-triager";
  return {
    query,
    found: true,
    facts: [
      { key: "survivor", value: "refund.ts:58 conditional boundary" },
      { key: "test_gap", value: "missing case when amount is zero" }
    ],
    count: 2
  };
}

export function buildMutationTestTriagerPrompt(task: string): string {
  return [
    "You are the Mutation Test Triager.",
    "Mutation triage.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the mutation-test-triager example."}`
  ].join("\n");
}

export function createMutationTestTriagerCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the mutation-test-triager example.",
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
