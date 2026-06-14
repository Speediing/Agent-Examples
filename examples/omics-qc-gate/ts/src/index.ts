import { Agent } from "@cursor/sdk";
import {
  buildOmicsQcGatePrompt,
  createOmicsQcGateCustomTools,
  runOmicsQc,
} from "./tools.js";

const args = process.argv.slice(2);
const scanOnly = args.includes("--scan-only");
const positionalArgs = args.filter((arg) => arg !== "--scan-only");
const task = positionalArgs.join(" ").trim();

try {
  if (scanOnly) {
    const result = runOmicsQc();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.passed ? 0 : 1);
  }

  const result = await Agent.prompt(buildOmicsQcGatePrompt(task), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: {
      cwd: process.cwd(),
      customTools: createOmicsQcGateCustomTools(),
    },
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
