import { Agent } from "@cursor/sdk";
import { buildCoveragePrompt } from "./agent.js";

function repoUrl(target: string): string {
  return target.startsWith("http") ? target : `https://github.com/${target}`;
}

try {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: npm run cover:ts -- <owner>/<repo> <file>");
  }
  const file = process.argv[3];
  if (!file) {
    throw new Error("Usage: npm run cover:ts -- <owner>/<repo> <file-under-test>");
  }

  const result = await Agent.prompt(buildCoveragePrompt(file), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    cloud: {
      repos: [{ url: repoUrl(target), startingRef: "main" }],
      autoCreatePR: true
    }
  });

  console.log(`Run ID: ${result.id}`);
  console.log(`Status: ${result.status}`);
  const prUrl = result.git?.branches?.find((branch) => branch.prUrl)?.prUrl;
  if (prUrl) {
    console.log(`PR: ${prUrl}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Set it before running.`);
  return value;
}
