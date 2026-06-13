export function buildEvalTraceGraderPrompt(task: string): string {
  return [
    "You are the Eval Trace Grader.",
    "Describe how behavioral evals grade tool choice and grounding from run.stream() traces.",
    "Point readers to eval/tier1 and eval/lib in Agent-Examples.",
    `Task: ${task || "Explain trace grading for agent evals."}`
  ].join("\n");
}
