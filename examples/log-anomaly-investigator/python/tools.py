from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

SIGNALS: dict[str, dict[str, object]] = {
    "log-anomaly-investigator": {"status": "investigating", "evidence": ["signal-a", "signal-b"]}
}

def get_signals(args: dict[str, object]) -> dict[str, object]:
    subject = _read_string(args.get("subject")) or "log-anomaly-investigator"
    signal = SIGNALS.get(subject, SIGNALS["log-anomaly-investigator"])
    return {"subject": subject, "found": True, "signal": signal, "known_subjects": list(SIGNALS)}

def build_log_anomaly_investigator_prompt(task: str) -> str:
    return "\n".join([
        "You are the Log Anomaly Investigator.",
        "Log investigation gate.",
        "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
        f"Incident or subject: {task or 'log-anomaly-investigator investigation'}",
    ])

def create_log_anomaly_investigator_custom_tools() -> dict[str, object]:
    return {
        "get_signals": {
            "description": "Return mock investigation signals for the log-anomaly-investigator example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Service, diff, or incident label"},
                },
            },
            "execute": get_signals,
        }
    }
