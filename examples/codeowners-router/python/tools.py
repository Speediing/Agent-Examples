from __future__ import annotations

def build_codeowners_router_prompt(task: str) -> str:
    return "\n".join([
        "You are the Codeowners Router.",
        "Reviewer routing.",
        f"Task: {task or 'Run the codeowners-router example.'}",
    ])

def create_codeowners_router_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "codeowners-router"}],
                "count": 1,
            },
        }
    }
