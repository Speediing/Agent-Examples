import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type SchemaDiff = {
  table: string;
  column: string;
  type: string;
  default: string;
  migration_file: string;
  sql: string;
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadSchemaDiff(): SchemaDiff {
  const raw = fs.readFileSync(
    path.join(exampleRoot, "fixtures/schema-diff.json"),
    "utf8",
  );
  return JSON.parse(raw) as SchemaDiff;
}

export function readSchemaDiff() {
  const diff = loadSchemaDiff();
  return {
    table: diff.table,
    column: diff.column,
    column_type: diff.type,
    default_value: diff.default,
    migration_file: diff.migration_file,
    draft_sql: diff.sql,
    writes_enabled: process.argv.includes("--act"),
  };
}

export function buildDbMigrationDrafterPrompt(task: string): string {
  return [
    "You are the DB Migration Drafter.",
    "Gated migration drafts.",
    "Call read_schema_diff first. Only recommend applying SQL when writes_enabled is true.",
    `Task: ${task || "Draft a migration from the schema diff fixture."}`,
  ].join("\n");
}

export function createDbMigrationDrafterCustomTools() {
  return {
    read_schema_diff: {
      description: "Return schema diff and draft SQL from the migration fixture.",
      inputSchema: { type: "object", properties: {} },
      execute: () => readSchemaDiff(),
    },
  };
}
