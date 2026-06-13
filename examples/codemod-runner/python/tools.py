from __future__ import annotations

def build_codemod_runner_prompt(task: str) -> str:
    return "\n".join([
        "You are the Codemod Runner.",
        "Codemod audit then act.",
        f"Task: {task or 'Run the codemod-runner example.'}",
    ])

def create_codemod_runner_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "codemod-runner"}],
                "count": 1,
            },
        }
    }
