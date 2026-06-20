import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { evalConfig } from "./config.js";
import type { DefinedEvalHandle } from "./define-eval.js";

export function discoverEvalFiles(rootDir = path.join(evalConfig.repoRoot, "eval/evals")): string[] {
  try {
    return readdirSync(rootDir)
      .filter((name) => name.endsWith(".eval.ts"))
      .map((name) => path.join(rootDir, name))
      .sort();
  } catch {
    return [];
  }
}

export async function loadDefinedEvals(
  rootDir = path.join(evalConfig.repoRoot, "eval/evals")
): Promise<DefinedEvalHandle[]> {
  const files = discoverEvalFiles(rootDir);
  const loaded: DefinedEvalHandle[] = [];

  for (const filePath of files) {
    const module = await import(pathToFileURL(filePath).href);
    const candidate = module.default;
    if (candidate && typeof candidate.run === "function" && candidate.description) {
      loaded.push(candidate as DefinedEvalHandle);
    }
  }

  return loaded;
}
