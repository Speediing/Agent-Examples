from __future__ import annotations

def build_requirements_clarifier_prompt(thread_text: str) -> str:
    return "\n".join([
        "You are the Requirements Clarifier.",
        "Chat clarifier.",
        "Do not claim you created a ticket or opened a pull request.",
        f"Thread:\n{thread_text or 'Example requirements-clarifier thread.'}",
    ])
