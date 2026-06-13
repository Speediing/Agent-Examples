import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type CollisionRecord = {
  linear_issue: string;
  similar_code: string;
  prior_art_module: string;
  related_adr: string;
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadCollisions(): CollisionRecord[] {
  const raw = fs.readFileSync(
    path.join(exampleRoot, "fixtures/collisions.json"),
    "utf8",
  );
  return JSON.parse(raw) as CollisionRecord[];
}

export function searchCollisions(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "checkout";
  const records = loadCollisions().filter((record) =>
    JSON.stringify(record).toLowerCase().includes(query),
  );
  return {
    query,
    matches: records,
    count: records.length,
    found: records.length > 0,
  };
}

export function buildDuplicateTicketDetectorPrompt(task: string): string {
  return [
    "You are the Duplicate Ticket Detector.",
    "Collision and prior art search before plan.",
    "Call search_collisions before you summarize.",
    "Report duplicate tickets and prior art from tool output only.",
    `Task: ${task || "Search for ticket and code collisions."}`,
  ].join("\n");
}

export function createDuplicateTicketDetectorCustomTools() {
  return {
    search_collisions: {
      description:
        "Search issues, ADRs, and code collisions from the duplicate-ticket fixture.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Short task or topic string" },
        },
      },
      execute: (args: { query?: SDKJsonValue }) => searchCollisions(args),
    },
  };
}
