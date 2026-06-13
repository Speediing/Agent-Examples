from __future__ import annotations

def build_estimation_helper_prompt(task: str) -> str:
    return "\n".join([
        "You are the Estimation Helper.",
        "Estimation with file evidence.",
        f"Task: {task or 'Run the estimation-helper example.'}",
    ])

def create_estimation_helper_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "estimation-helper"}],
                "count": 1,
            },
        }
    }
