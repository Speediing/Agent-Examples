from __future__ import annotations

def build_adr_writer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Adr Writer.",
        "ADR from design discussion.",
        f"Task: {task or 'Run the adr-writer example with a realistic input.'}",
    ])
