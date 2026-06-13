import { Agent } from "@cursor/sdk";
import {
  buildRiskClassifierPrompt,
  createRiskClassifierCustomTools
} from "./tools.js";

try {
  const title = process.argv.slice(2).join(" ").trim();
  const result = await Agent.prompt(buildRiskClassifierPrompt(title), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: {
      cwd: process.cwd(),
      customTools: createRiskClassifierCustomTools()
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
