import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "duplicate-ticket-detector";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "duplicate-ticket-detector" },
      { key: "lesson", value: "Collision detection before plan" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function buildDuplicateTicketDetectorPrompt(task: string): string {
  return [
    "You are the Duplicate Ticket Detector.",
    "Collision detection before plan.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the duplicate-ticket-detector example."}`
  ].join("\n");
}

export function createDuplicateTicketDetectorCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the duplicate-ticket-detector example.",
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
