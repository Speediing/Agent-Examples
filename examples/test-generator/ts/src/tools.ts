import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "test-generator";
  return {
    query,
    found: true,
    facts: [
      { key: "module", value: "src/payments/refund.ts" },
      { key: "exported_fn", value: "createRefund" }
    ],
    count: 2
  };
}

export function buildTestGeneratorPrompt(task: string): string {
  return [
    "You are the Test Generator.",
    "Gated test generation.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the test-generator example."}`
  ].join("\n");
}

export function createTestGeneratorCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the test-generator example.",
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
