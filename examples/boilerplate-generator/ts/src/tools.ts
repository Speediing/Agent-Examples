import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "boilerplate-generator";
  return {
    query,
    found: true,
    facts: [
      { key: "schema", value: "RefundRequest table in prisma/schema.prisma" },
      { key: "output_path", value: "src/payments/refund-request/" }
    ],
    count: 2
  };
}

export function buildBoilerplateGeneratorPrompt(task: string): string {
  return [
    "You are the Boilerplate Generator.",
    "Schema-driven codegen.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the boilerplate-generator example."}`
  ].join("\n");
}

export function createBoilerplateGeneratorCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the boilerplate-generator example.",
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
