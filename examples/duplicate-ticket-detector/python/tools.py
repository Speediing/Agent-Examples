from __future__ import annotations

def build_duplicate_ticket_detector_prompt(task: str) -> str:
    return "\n".join([
        "You are the Duplicate Ticket Detector.",
        "Collision detection before plan.",
        f"Task: {task or 'Run the duplicate-ticket-detector example.'}",
    ])

def create_duplicate_ticket_detector_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "duplicate-ticket-detector"}],
                "count": 1,
            },
        }
    }
