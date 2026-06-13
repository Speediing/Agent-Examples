import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type DesignContext = {
  topic: string;
  related_files: string[];
  constraints: string[];
  options: { name: string; tradeoff: string }[];
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadDesignContext(): DesignContext {
  const raw = fs.readFileSync(
    path.join(exampleRoot, "fixtures/design-context.json"),
    "utf8",
  );
  return JSON.parse(raw) as DesignContext;
}

export function loadDesignContextTool(args: { topic?: SDKJsonValue }) {
  const topic = readString(args.topic);
  const context = loadDesignContext();
  return {
    topic: topic || context.topic,
    related_files: context.related_files,
    constraints: context.constraints,
    options: context.options,
    count: context.related_files.length,
  };
}

export function buildAdrWriterPrompt(task: string): string {
  return [
    "You are the ADR Writer.",
    "ADR from design discussion.",
    "Call load_design_context before drafting. Cite related_files and options from tool output.",
    `Task: ${task || "Draft an ADR from the design context fixture."}`,
  ].join("\n");
}

export function createAdrWriterCustomTools() {
  return {
    load_design_context: {
      description:
        "Return related files, constraints, and options for an architecture decision from a fixture.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "ADR topic or decision title" },
        },
      },
      execute: (args: { topic?: SDKJsonValue }) => loadDesignContextTool(args),
    },
  };
}
