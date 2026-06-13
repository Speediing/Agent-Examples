from __future__ import annotations

def build_convention_fixer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Convention Fixer.",
        "Scan-fix-rescan for style.",
        f"Task: {task or 'Run the convention-fixer example.'}",
    ])

def create_convention_fixer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "convention-fixer"}],
                "count": 1,
            },
        }
    }
