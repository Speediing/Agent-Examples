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

export async function searchRepoFiles(args: {
  rootDir: string;
  query?: SDKJsonValue;
  limit?: SDKJsonValue;
}) {
  const query = readString(args.query).toLowerCase();
  const limit =
    typeof args.limit === "number" && args.limit > 0 ? Math.floor(args.limit) : 20;
  const matches: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    if (matches.length >= limit) {
      return;
    }

    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (matches.length >= limit) {
        return;
      }

      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(args.rootDir, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!query || relativePath.toLowerCase().includes(query)) {
        matches.push(relativePath);
      }
    }
  }

  await walk(args.rootDir);

  return {
    query,
    matches,
    count: matches.length
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

export function buildSpecDrafterPrompt(request: string): string {
  return [
    "You are the Spec Drafter Agent.",
    "Turn the feature request into a draft spec grounded in this repository.",
    "Use search_repo_files and read_repo_file before you name files, modules, or APIs.",
    "Do not invent code paths that the tools did not return.",
    "Return markdown with these sections:",
    "1. Summary",
    "2. Acceptance criteria",
    "3. Touched areas (cite file paths from tool results)",
    "4. Open questions for a human",
    "5. Risks and dependencies",
    `Feature request: ${request || "Add a read-only spec drafter example to the cookbook."}`
  ].join("\n");
}

export function createSpecDrafterCustomTools(rootDir: string) {
  return {
    search_repo_files: {
      description:
        "Search the repository for file paths that match a substring. Use this before naming modules to change.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Substring to match against relative file paths"
          },
          limit: {
            type: "number",
            description: "Maximum number of paths to return"
          }
        }
      },
      execute: (args: { query?: SDKJsonValue; limit?: SDKJsonValue }) =>
        searchRepoFiles({ rootDir, ...args })
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
