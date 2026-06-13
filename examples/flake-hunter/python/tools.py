from __future__ import annotations

def build_flake_hunter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Flake Hunter.",
        "Flake audit.",
        f"Task: {task or 'Run the flake-hunter example.'}",
    ])

def create_flake_hunter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "flake-hunter"}],
                "count": 1,
            },
        }
    }
