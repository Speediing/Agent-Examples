from __future__ import annotations

def build_postmortem_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Postmortem Drafter.",
        "Postmortem writer.",
        f"Task: {task or 'Run the postmortem-drafter example.'}",
    ])

def create_postmortem_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "postmortem-drafter"}],
                "count": 1,
            },
        }
    }
