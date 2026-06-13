from __future__ import annotations

def build_roadmap_digest_prompt(task: str) -> str:
    return "\n".join([
        "You are the Roadmap Digest.",
        "Scheduled digest writer.",
        f"Task: {task or 'Run the roadmap-digest example with a realistic input.'}",
    ])
