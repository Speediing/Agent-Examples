from __future__ import annotations

def build_mutation_test_triager_prompt(task: str) -> str:
    return "\n".join([
        "You are the Mutation Test Triager.",
        "Mutation triage.",
        f"Task: {task or 'Run the mutation-test-triager example.'}",
    ])

def create_mutation_test_triager_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "mutation-test-triager"}],
                "count": 1,
            },
        }
    }
