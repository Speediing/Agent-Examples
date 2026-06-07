import { Agent } from "@cursor/sdk";
import { evalConfig } from "./config.js";

export type JudgeVerdict = {
  pass: boolean;
  rationale: string;
};

export async function judgeResponse(options: {
  rubric: string;
  prompt: string;
  answer: string;
}): Promise<JudgeVerdict> {
  const judgePrompt = [
    "You grade agent outputs against a rubric.",
    "Reply with JSON only: {\"pass\": boolean, \"rationale\": string}.",
    "Rubric:",
    options.rubric,
    "",
    "Prompt:",
    options.prompt,
    "",
    "Answer:",
    options.answer
  ].join("\n");

  const result = await Agent.prompt(judgePrompt, {
    apiKey: evalConfig.apiKey,
    model: { id: evalConfig.judgeModelId }
  });

  const raw = result.result ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      pass: false,
      rationale: `Judge returned non-JSON: ${raw.slice(0, 200)}`
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as JudgeVerdict;
    return {
      pass: Boolean(parsed.pass),
      rationale: String(parsed.rationale ?? "")
    };
  } catch {
    return {
      pass: false,
      rationale: `Judge JSON parse failed: ${raw.slice(0, 200)}`
    };
  }
}
