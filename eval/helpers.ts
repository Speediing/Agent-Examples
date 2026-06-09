import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export function runPnpmScript(
  script: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = {}
) {
  return spawnSync("pnpm", ["run", script, ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

export function runNode(
  entry: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = {}
) {
  return spawnSync("node", [entry, ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

export { repoRoot };
