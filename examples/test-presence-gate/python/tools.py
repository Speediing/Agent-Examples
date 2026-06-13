from __future__ import annotations

def build_test_presence_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Test Presence Gate.",
        "Test presence gate.",
        f"Task: {task or 'Run the test-presence-gate example.'}",
    ])

def create_test_presence_gate_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "test-presence-gate"}],
                "count": 1,
            },
        }
    }
