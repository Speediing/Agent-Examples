from __future__ import annotations

def build_incident_comms_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Incident Comms Drafter.",
        "Incident comms writer.",
        f"Task: {task or 'Run the incident-comms-drafter example with a realistic input.'}",
    ])
