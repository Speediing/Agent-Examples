from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

SIGNALS: dict[str, dict[str, object]] = {
    "postmortem-drafter": {"status": "investigating", "evidence": ["signal-a", "signal-b"]}
}

def get_signals(args: dict[str, object]) -> dict[str, object]:
    subject = _read_string(args.get("subject")) or "postmortem-drafter"
    signal = SIGNALS.get(subject, SIGNALS["postmortem-drafter"])
    return {"subject": subject, "found": True, "signal": signal, "known_subjects": list(SIGNALS)}

def build_postmortem_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Postmortem Drafter.",
        "Postmortem writer.",
        "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
        f"Incident or subject: {task or 'postmortem-drafter investigation'}",
    ])

def create_postmortem_drafter_custom_tools() -> dict[str, object]:
    return {
        "get_signals": {
            "description": "Return mock investigation signals for the postmortem-drafter example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Service, diff, or incident label"},
                },
            },
            "execute": get_signals,
        }
    }
