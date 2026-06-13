from __future__ import annotations

def build_backlog_groomer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Backlog Groomer.",
        "Scheduled backlog audit.",
        f"Task: {task or 'Run the backlog-groomer example.'}",
    ])

def create_backlog_groomer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "backlog-groomer"}],
                "count": 1,
            },
        }
    }
