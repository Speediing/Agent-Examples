from __future__ import annotations

def build_convention_reviewer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Convention Reviewer.",
        "Style scan gate.",
        f"Task: {task or 'Run the convention-reviewer example.'}",
    ])

def create_convention_reviewer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "convention-reviewer"}],
                "count": 1,
            },
        }
    }
