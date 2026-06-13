import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type ScaffoldPlan = {
  module: string;
  convention: string;
  target_path: string;
  proposed_files: string[];
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadPlan(): ScaffoldPlan {
  const raw = fs.readFileSync(
    path.join(exampleRoot, "fixtures/scaffold-plan.json"),
    "utf8",
  );
  return JSON.parse(raw) as ScaffoldPlan;
}

export function proposeScaffold(args: { module?: SDKJsonValue }) {
  const plan = loadPlan();
  const module = readString(args.module) || plan.module;
  return {
    module,
    convention: plan.convention,
    target_path: plan.target_path,
    proposed_files: plan.proposed_files,
    count: plan.proposed_files.length,
    writes_enabled: process.argv.includes("--act"),
  };
}

export function buildScaffoldingAgentPrompt(task: string): string {
  return [
    "You are the Scaffolding Agent.",
    "Gated scaffolding.",
    "Call propose_scaffold first. Only recommend creating files when writes_enabled is true.",
    `Task: ${task || "Propose a gated module scaffold from the fixture plan."}`,
  ].join("\n");
}

export function createScaffoldingAgentCustomTools() {
  return {
    propose_scaffold: {
      description: "Return a scaffold plan with proposed file paths from house conventions.",
      inputSchema: {
        type: "object",
        properties: {
          module: { type: "string", description: "Module path to scaffold" },
        },
      },
      execute: (args: { module?: SDKJsonValue }) => proposeScaffold(args),
    },
  };
}
