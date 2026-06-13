from __future__ import annotations

def build_slo_budget_reporter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Slo Budget Reporter.",
        "SLO reporter.",
        f"Task: {task or 'Run the slo-budget-reporter example with a realistic input.'}",
    ])
