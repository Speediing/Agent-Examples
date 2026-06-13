from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "change-ticket-drafter"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "example", "value": "change-ticket-drafter"},
            {"key": "lesson", "value": "Change ticket writer"},
            {"key": "pattern", "value": "local-tools"},
        ],
        "count": 3,
    }

def build_change_ticket_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Change Ticket Drafter.",
        "Change ticket writer.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the change-ticket-drafter example.'}",
    ])

def create_change_ticket_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the change-ticket-drafter example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
