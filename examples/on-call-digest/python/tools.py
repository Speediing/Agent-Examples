from __future__ import annotations

def build_on_call_digest_prompt(task: str) -> str:
    return "\n".join([
        "You are the On Call Digest.",
        "On-call digest.",
        f"Task: {task or 'Run the on-call-digest example with a realistic input.'}",
    ])
