from __future__ import annotations

def build_release_notes_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Release Notes Drafter.",
        "Release notes writer.",
        f"Task: {task or 'Run the release-notes-drafter example with a realistic input.'}",
    ])
