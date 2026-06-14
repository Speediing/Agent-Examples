import { Agent } from "@cursor/sdk";
import {
  buildInheritedAnalysisExplainerPrompt,
  createInheritedAnalysisExplainerCustomTools,
} from "./tools.js";

const args = process.argv.slice(2);
const scanOnly = args.includes("--scan-only");
const positionalArgs = args.filter((arg) => arg !== "--scan-only");
const question = positionalArgs.join(" ").trim();

try {
  if (scanOnly) {
    const tools = createInheritedAnalysisExplainerCustomTools();
    const listing = await tools.list_analysis_files.execute({});
    const readme = await tools.read_analysis_file.execute({ path: "README.md" });
    console.log(JSON.stringify({ listing, readme }, null, 2));
    process.exit(0);
  }

  const result = await Agent.prompt(buildInheritedAnalysisExplainerPrompt(question), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: {
      cwd: process.cwd(),
      customTools: createInheritedAnalysisExplainerCustomTools(),
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
