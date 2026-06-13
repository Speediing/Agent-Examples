from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "mutation-test-triager"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "survivor", "value": "refund.ts:58 conditional boundary"},
            {"key": "test_gap", "value": "missing case when amount is zero"}
        ],
        "count": 2,
    }

def build_mutation_test_triager_prompt(task: str) -> str:
    return "\n".join([
        "You are the Mutation Test Triager.",
        "Mutation triage.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the mutation-test-triager example.'}",
    ])

def create_mutation_test_triager_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the mutation-test-triager example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
