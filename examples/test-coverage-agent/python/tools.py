from __future__ import annotations

def build_test_coverage_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Test Coverage Agent.",
        "Coverage gap finder.",
        f"Task: {task or 'Run the test-coverage-agent example.'}",
    ])

def create_test_coverage_agent_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "test-coverage-agent"}],
                "count": 1,
            },
        }
    }
