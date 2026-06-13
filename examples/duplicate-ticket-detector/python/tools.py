from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "duplicate-ticket-detector"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "linear_issue", "value": "TEAM-482 checkout 503 after deploy"},
            {"key": "similar_code", "value": "src/checkout/retry.ts handles deploy windows"}
        ],
        "count": 2,
    }

def build_duplicate_ticket_detector_prompt(task: str) -> str:
    return "\n".join([
        "You are the Duplicate Ticket Detector.",
        "Collision detection before plan.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the duplicate-ticket-detector example.'}",
    ])

def create_duplicate_ticket_detector_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the duplicate-ticket-detector example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
