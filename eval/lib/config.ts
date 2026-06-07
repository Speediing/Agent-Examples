import type { SDKCustomTool } from "@cursor/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

export const evalConfig = {
  apiKey: process.env.CURSOR_API_KEY ?? "",
  modelId: process.env.CURSOR_MODEL ?? process.env.CURSOR_AGENT_MODEL ?? "",
  judgeModelId:
    process.env.CURSOR_JUDGE_MODEL ??
    process.env.CURSOR_MODEL ??
    process.env.CURSOR_AGENT_MODEL ??
    "",
  maxCasesPerJob: Number(process.env.EVAL_MAX_CASES ?? "20"),
  maxSamplesPerCase: Number(process.env.EVAL_SAMPLES ?? "1"),
  maxWallClockMsPerCase: Number(process.env.EVAL_CASE_TIMEOUT_MS ?? "120000"),
  maxToolCallsPerCase: Number(process.env.EVAL_MAX_TOOL_CALLS ?? "30"),
  repoRoot
};

export function llmEvalsEnabled(): boolean {
  return Boolean(evalConfig.apiKey && evalConfig.modelId);
}

export function requireLlmEvals(): void {
  if (!llmEvalsEnabled()) {
    throw new Error(
      "LLM evals require CURSOR_API_KEY and CURSOR_MODEL (or CURSOR_AGENT_MODEL)."
    );
  }
}

export type AgentRunConfig = {
  prompt: string;
  customTools?: Record<string, SDKCustomTool>;
  cwd?: string;
};
