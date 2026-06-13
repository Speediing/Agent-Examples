import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "codeowners-router";
  return {
    query,
    found: true,
    facts: [
      { key: "payments_paths", value: "src/payments/**" },
      { key: "suggested_reviewers", value: "@payments-team, @infra-oncall" }
    ],
    count: 2
  };
}

export function buildCodeownersRouterPrompt(task: string): string {
  return [
    "You are the Codeowners Router.",
    "Reviewer routing.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the codeowners-router example."}`
  ].join("\n");
}

export function createCodeownersRouterCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the codeowners-router example.",
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
