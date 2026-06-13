from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

SIGNALS: dict[str, dict[str, object]] = {
    "security-review-agent": {"status": "investigating", "evidence": ["signal-a", "signal-b"]}
}

def get_signals(args: dict[str, object]) -> dict[str, object]:
    subject = _read_string(args.get("subject")) or "security-review-agent"
    signal = SIGNALS.get(subject, SIGNALS["security-review-agent"])
    return {"subject": subject, "found": True, "signal": signal, "known_subjects": list(SIGNALS)}

def build_security_review_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Security Review Agent.",
        "Security investigation gate.",
        "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
        f"Incident or subject: {task or 'security-review-agent investigation'}",
    ])

def create_security_review_agent_custom_tools() -> dict[str, object]:
    return {
        "get_signals": {
            "description": "Return mock investigation signals for the security-review-agent example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Service, diff, or incident label"},
                },
            },
            "execute": get_signals,
        }
    }
