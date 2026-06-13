from __future__ import annotations

def build_log_anomaly_investigator_prompt(task: str) -> str:
    return "\n".join([
        "You are the Log Anomaly Investigator.",
        "Log investigation gate.",
        f"Task: {task or 'Run the log-anomaly-investigator example.'}",
    ])

def create_log_anomaly_investigator_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "log-anomaly-investigator"}],
                "count": 1,
            },
        }
    }
