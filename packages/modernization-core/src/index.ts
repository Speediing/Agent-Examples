import { Agent } from "@cursor/sdk";

export function repoUrl(target: string): string {
  return target.startsWith("http") ? target : `https://github.com/${target}`;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running.`);
  }
  return value;
}

export type CloudSubmitResult = {
  runId: string;
  status: string;
  prUrl?: string;
};

export type CloudSubmitOptions = {
  target: string;
  prompt: string;
  ref?: string;
};

export async function submitCloudAgent(
  options: CloudSubmitOptions,
): Promise<CloudSubmitResult> {
  const result = await Agent.prompt(options.prompt, {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    cloud: {
      repos: [
        {
          url: repoUrl(options.target),
          startingRef: options.ref ?? "main",
        },
      ],
      autoCreatePR: true,
    },
  });

  const prUrl = result.git?.branches?.find((branch) => branch.prUrl)?.prUrl;

  return {
    runId: result.id,
    status: result.status,
    prUrl,
  };
}

export function printCloudResult(result: CloudSubmitResult): void {
  console.log(`Run ID: ${result.runId}`);
  console.log(`Status: ${result.status}`);
  if (result.prUrl) {
    console.log(`PR: ${result.prUrl}`);
  }
}
