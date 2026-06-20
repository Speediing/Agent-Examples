import { Agent } from "@cursor/sdk";
import { createToolCallingAgent } from "./agent.js";

try {
  const userMessage = process.argv.slice(2).join(" ").trim();
  const agent = createToolCallingAgent();
  const runInput = agent.send(userMessage);
  const result = await Agent.prompt(runInput.prompt, {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: {
      cwd: runInput.cwd ?? process.cwd(),
      customTools: runInput.customTools
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
