import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent } from "@cursor/sdk";
import {
  buildCodebaseExplainerPrompt,
  createCodebaseExplainerCustomTools
} from "./tools.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

try {
  const [modulePath = "examples/hello-world", ...questionParts] = process.argv.slice(2);
  const question = questionParts.join(" ").trim();
  const result = await Agent.prompt(
    buildCodebaseExplainerPrompt(modulePath, question),
    {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: {
        cwd: rootDir,
        customTools: createCodebaseExplainerCustomTools(rootDir)
      }
    }
  );

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
