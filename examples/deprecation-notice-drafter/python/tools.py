from __future__ import annotations

def build_deprecation_notice_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Deprecation Notice Drafter.",
        "Deprecation comms.",
        f"Task: {task or 'Run the deprecation-notice-drafter example with a realistic input.'}",
    ])
