import { spawnSync } from "node:child_process";
import path from "node:path";

export function gitLatestCommitTimeMs(
  filePath: string,
  cwd: string
): number | null {
  const relativePath = path.relative(cwd, filePath);
  const result = spawnSync(
    "git",
    ["log", "-1", "--format=%ct", "--", relativePath],
    {
      cwd,
      encoding: "utf8"
    }
  );

  if (result.status !== 0) {
    return null;
  }

  const value = result.stdout.trim();
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

export async function latestSourceSignal(
  files: string[],
  cwd: string,
  statMtime: (filePath: string) => Promise<number>
): Promise<number> {
  if (files.length === 0) {
    return 0;
  }

  const signals = await Promise.all(
    files.map(async (file) => {
      const gitSignal = gitLatestCommitTimeMs(file, cwd);
      if (gitSignal !== null) {
        return gitSignal;
      }

      return statMtime(file);
    })
  );

  return Math.max(...signals);
}
