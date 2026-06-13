import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "db-migration-drafter";
  return {
    query,
    found: true,
    facts: [
      { key: "column", value: "orders.refund_status varchar(32)" },
      { key: "migration_file", value: "migrations/20260301_add_refund_status.sql" }
    ],
    count: 2
  };
}

export function buildDbMigrationDrafterPrompt(task: string): string {
  return [
    "You are the DB Migration Drafter.",
    "Gated migration drafts.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    `Task: ${task || "Run the db-migration-drafter example."}`
  ].join("\n");
}

export function createDbMigrationDrafterCustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the db-migration-drafter example.",
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
