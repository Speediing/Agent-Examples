import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent } from "@cursor/sdk";
import {
  buildSpecDrafterPrompt,
  createSpecDrafterCustomTools
} from "./tools.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

try {
  const request = process.argv.slice(2).join(" ").trim();
  const result = await Agent.prompt(buildSpecDrafterPrompt(request), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: {
      cwd: rootDir,
      customTools: createSpecDrafterCustomTools(rootDir)
    }
  });

  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
