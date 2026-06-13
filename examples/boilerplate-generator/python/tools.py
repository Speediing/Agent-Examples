from __future__ import annotations

def build_boilerplate_generator_prompt(task: str) -> str:
    return "\n".join([
        "You are the Boilerplate Generator.",
        "Schema-driven codegen.",
        f"Task: {task or 'Run the boilerplate-generator example.'}",
    ])

def create_boilerplate_generator_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "boilerplate-generator"}],
                "count": 1,
            },
        }
    }
