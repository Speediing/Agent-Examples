import fs from "node:fs/promises";
import path from "node:path";
import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveRepoPath(rootDir: string, relativePath: string): string | null {
  const fullPath = path.resolve(rootDir, relativePath);
  const relative = path.relative(path.resolve(rootDir), fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return fullPath;
}

export async function listModuleFiles(args: {
  rootDir: string;
  module_path?: SDKJsonValue;
  limit?: SDKJsonValue;
}) {
  const modulePath = readString(args.module_path) || ".";
  const limit =
    typeof args.limit === "number" && args.limit > 0 ? Math.floor(args.limit) : 30;
  const fullPath = resolveRepoPath(args.rootDir, modulePath);

  if (!fullPath) {
    return {
      found: false,
      module_path: modulePath,
      files: [],
      count: 0,
      reason: "Module path must stay inside the repository root."
    };
  }

  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    if (files.length >= limit) {
      return;
    }

    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= limit) {
        return;
      }

      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
        continue;
      }

      const entryPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(args.rootDir, entryPath);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      files.push(relativePath);
    }
  }

  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      await walk(fullPath);
    } else {
      files.push(path.relative(args.rootDir, fullPath));
    }
  } catch {
    return {
      found: false,
      module_path: modulePath,
      files: [],
      count: 0,
      reason: "Module path not found."
    };
  }

  return {
    found: true,
    module_path: modulePath,
    files,
    count: files.length,
    reason: null
  };
}

export async function readRepoFile(args: {
  rootDir: string;
  path?: SDKJsonValue;
  max_bytes?: SDKJsonValue;
}) {
  const relativePath = readString(args.path);
  const maxBytes =
    typeof args.max_bytes === "number" && args.max_bytes > 0
      ? Math.floor(args.max_bytes)
      : 12_000;
  const fullPath = resolveRepoPath(args.rootDir, relativePath);

  if (!relativePath || !fullPath) {
    return {
      found: false,
      path: relativePath,
      content: null,
      truncated: false,
      reason: "Path must stay inside the repository root."
    };
  }

  try {
    const content = await fs.readFile(fullPath, "utf8");
    const truncated = content.length > maxBytes;

    return {
      found: true,
      path: relativePath,
      content: truncated ? content.slice(0, maxBytes) : content,
      truncated,
      reason: truncated ? `Truncated to ${maxBytes} bytes.` : null
    };
  } catch {
    return {
      found: false,
      path: relativePath,
      content: null,
      truncated: false,
      reason: "File not found or unreadable."
    };
  }
}

export function buildCodebaseExplainerPrompt(modulePath: string, question: string): string {
  return [
    "You are the Codebase Explainer Agent.",
    "Explain the requested module for a developer who is new to this repository.",
    "Use list_module_files and read_repo_file before you describe structure or behavior.",
    "Do not invent files, exports, or runtime behavior that the tools did not return.",
    "Return markdown with these sections:",
    "1. What this module does",
    "2. Key files and entrypoints",
    "3. How data or control flows through it",
    "4. Where to start reading",
    "5. Safe next questions for a human owner",
    `Module path: ${modulePath || "examples/hello-world"}`,
    `Question: ${question || "How does this example work end to end?"}`
  ].join("\n");
}

export function createCodebaseExplainerCustomTools(rootDir: string) {
  return {
    list_module_files: {
      description:
        "List files under a repo-relative module path. Use this to map an unfamiliar subsystem.",
      inputSchema: {
        type: "object",
        properties: {
          module_path: {
            type: "string",
            description: "Repo-relative directory or file path"
          },
          limit: {
            type: "number",
            description: "Maximum number of files to return"
          }
        }
      },
      execute: (args: { module_path?: SDKJsonValue; limit?: SDKJsonValue }) =>
        listModuleFiles({ rootDir, ...args })
    },
    read_repo_file: {
      description:
        "Read a text file from the repository checkout. Paths must stay inside the repo root.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Repo-relative file path"
          },
          max_bytes: {
            type: "number",
            description: "Maximum bytes to return"
          }
        },
        required: ["path"]
      },
      execute: (args: { path?: SDKJsonValue; max_bytes?: SDKJsonValue }) =>
        readRepoFile({ rootDir, ...args })
    }
  };
}
