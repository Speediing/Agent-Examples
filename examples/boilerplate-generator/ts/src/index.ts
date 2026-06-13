import { Agent } from "@cursor/sdk";
import { buildBoilerplateGeneratorPrompt, createBoilerplateGeneratorCustomTools } from "./tools.js";

try {
  const task = process.argv.slice(2).filter((a) => a !== "--act").join(" ").trim();
  const result = await Agent.prompt(buildBoilerplateGeneratorPrompt(task), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: { cwd: process.cwd(), customTools: createBoilerplateGeneratorCustomTools() }
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
