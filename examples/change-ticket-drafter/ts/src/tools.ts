import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "change-ticket-drafter";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "change-ticket-drafter" },
      { key: "lesson", value: "Change ticket writer" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function buildChangeTicketDrafterPrompt(task: string): string {
  return [
    "You are the Change Ticket Drafter.",
    "Change ticket writer.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the change-ticket-drafter example."}`
  ].join("\n");
}

export function createChangeTicketDrafterCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the change-ticket-drafter example.",
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
