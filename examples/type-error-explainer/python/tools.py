from __future__ import annotations

def build_type_error_explainer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Type Error Explainer.",
        "Compiler output explainer.",
        f"Task: {task or 'Run the type-error-explainer example.'}",
    ])

def create_type_error_explainer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "type-error-explainer"}],
                "count": 1,
            },
        }
    }
