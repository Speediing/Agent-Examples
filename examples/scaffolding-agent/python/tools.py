from __future__ import annotations

def build_scaffolding_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Scaffolding Agent.",
        "Gated scaffolding.",
        f"Task: {task or 'Run the scaffolding-agent example.'}",
    ])

def create_scaffolding_agent_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "scaffolding-agent"}],
                "count": 1,
            },
        }
    }
