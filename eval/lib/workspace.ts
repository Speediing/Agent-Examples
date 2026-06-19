import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { EvalContext, WorkspaceSeed, WorkspaceSnapshot } from "./types.js";
import { evalConfig } from "./config.js";

function gitOutput(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

export function captureWorkspaceSnapshot(cwd: string): WorkspaceSnapshot {
  return {
    cwd,
    gitBefore: gitOutput(["rev-parse", "HEAD"], cwd),
    gitAfter: gitOutput(["rev-parse", "HEAD"], cwd),
    diff: gitOutput(["diff", "--"], cwd)
  };
}

export function finalizeWorkspaceSnapshot(
  before: WorkspaceSnapshot
): WorkspaceSnapshot {
  return {
    cwd: before.cwd,
    gitBefore: before.gitBefore,
    gitAfter: gitOutput(["rev-parse", "HEAD"], before.cwd),
    diff: gitOutput(["diff", "--"], before.cwd)
  };
}

export function readFileBytes(repoRoot: string, relativePath: string): Buffer {
  return readFileSync(path.join(repoRoot, relativePath));
}

export function prepareWorkspace(seed?: WorkspaceSeed): EvalContext {
  const repoRoot = evalConfig.repoRoot;
  const workspaceDir = repoRoot;
  const scratchPaths = new Map<string, string>();

  if (seed) {
    for (const copy of seed.copyFiles) {
      const fromPath = path.join(repoRoot, copy.from);
      const toPath = path.join(repoRoot, copy.to);
      mkdirSync(path.dirname(toPath), { recursive: true });
      copyFileSync(fromPath, toPath);
      scratchPaths.set(copy.to, toPath);
    }
  }

  return { repoRoot, workspaceDir, scratchPaths };
}

export function cleanupWorkspace(
  ctx: EvalContext,
  seed?: WorkspaceSeed
): void {
  if (!seed) {
    return;
  }

  for (const relativePath of seed.cleanupPaths) {
    const absolutePath = path.join(ctx.repoRoot, relativePath);
    rmSync(absolutePath, { force: true, recursive: true });
  }
}
