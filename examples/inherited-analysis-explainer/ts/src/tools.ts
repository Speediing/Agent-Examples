import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixtureRoot = path.join(exampleRoot, "fixtures", "legacy-repo");

function resolveFixturePath(relativePath: string): string | null {
  const root = path.resolve(fixtureRoot);
  const fullPath = path.resolve(root, relativePath);
  const relative = path.relative(root, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return fullPath;
}

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function listAnalysisFiles(args: { limit?: SDKJsonValue }) {
  const limit =
    typeof args.limit === "number" && args.limit > 0 ? Math.floor(args.limit) : 20;
  const files = fs
    .readdirSync(fixtureRoot)
    .filter((name) => !name.startsWith("."))
    .sort()
    .slice(0, limit);

  return {
    found: true,
    root: "fixtures/legacy-repo",
    files,
    count: files.length,
    languages: ["R"],
  };
}

export function readAnalysisFile(args: { path?: SDKJsonValue }) {
  const relativePath = readString(args.path);
  const fullPath = relativePath ? resolveFixturePath(relativePath) : null;

  if (!fullPath) {
    return {
      found: false,
      path: relativePath,
      content: null,
      reason: "Path must stay inside fixtures/legacy-repo.",
    };
  }

  if (!fs.existsSync(fullPath)) {
    return {
      found: false,
      path: relativePath,
      content: null,
      reason: "File not found.",
    };
  }

  return {
    found: true,
    path: relativePath,
    content: fs.readFileSync(fullPath, "utf8"),
    reason: null,
  };
}

export function buildInheritedAnalysisExplainerPrompt(question: string): string {
  return [
    "You are the Inherited Analysis Explainer.",
    "Help a scientist understand a legacy R analysis repository.",
    "Call list_analysis_files and read_analysis_file before describing structure.",
    "Do not invent files, paths, or parameters that tools did not return.",
    `Question: ${question || "Where should I start reading this analysis repo?"}`,
  ].join("\n");
}

export function createInheritedAnalysisExplainerCustomTools() {
  return {
    list_analysis_files: {
      description: "List files in the inherited analysis fixture repository.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum files to return" },
        },
      },
      execute: (args: { limit?: SDKJsonValue }) => listAnalysisFiles(args),
    },
    read_analysis_file: {
      description: "Read a text file from the inherited analysis fixture repo.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File name inside legacy-repo" },
        },
        required: ["path"],
      },
      execute: (args: { path?: SDKJsonValue }) => readAnalysisFile(args),
    },
  };
}
