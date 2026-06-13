from __future__ import annotations

def build_test_generator_prompt(task: str) -> str:
    return "\n".join([
        "You are the Test Generator.",
        "Gated test generation.",
        f"Task: {task or 'Run the test-generator example.'}",
    ])

def create_test_generator_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "test-generator"}],
                "count": 1,
            },
        }
    }
