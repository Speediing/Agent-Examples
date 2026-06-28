import { Agent } from "@cursor/sdk";
import { buildContainerizePrompt } from "./agent.js";

function repoUrl(target: string): string {
  return target.startsWith("http") ? target : `https://github.com/${target}`;
}

try {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: npm run containerize:ts -- <owner>/<repo>");
  }

  const result = await Agent.prompt(buildContainerizePrompt(), {
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
