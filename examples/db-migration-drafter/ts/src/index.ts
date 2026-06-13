import { Agent } from "@cursor/sdk";
import { buildDbMigrationDrafterPrompt, createDbMigrationDrafterCustomTools } from "./tools.js";

try {
  const task = process.argv.slice(2).filter((a) => a !== "--act").join(" ").trim();
  const result = await Agent.prompt(buildDbMigrationDrafterPrompt(task), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: { cwd: process.cwd(), customTools: createDbMigrationDrafterCustomTools() }
  });
  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}
