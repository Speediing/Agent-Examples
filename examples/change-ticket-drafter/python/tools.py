from __future__ import annotations

def build_change_ticket_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Change Ticket Drafter.",
        "Change ticket writer.",
        f"Task: {task or 'Run the change-ticket-drafter example.'}",
    ])

def create_change_ticket_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "change-ticket-drafter"}],
                "count": 1,
            },
        }
    }
