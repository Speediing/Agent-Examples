from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "test-coverage-agent"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "example", "value": "test-coverage-agent"},
            {"key": "lesson", "value": "Coverage gap finder"},
            {"key": "pattern", "value": "local-tools"},
        ],
        "count": 3,
    }

def build_test_coverage_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Test Coverage Agent.",
        "Coverage gap finder.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the test-coverage-agent example.'}",
    ])

def create_test_coverage_agent_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the test-coverage-agent example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
