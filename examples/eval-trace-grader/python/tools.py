from __future__ import annotations

def build_eval_trace_grader_prompt(task: str) -> str:
    return "\n".join([
        "You are the Eval Trace Grader.",
        "Describe how behavioral evals grade tool choice and grounding from run.stream() traces.",
        "Point readers to eval/tier1 and eval/lib in Agent-Examples.",
        f"Task: {task or 'Explain trace grading for agent evals.'}",
    ])
