from __future__ import annotations

def build_deprecation_notice_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Deprecation Notice Drafter.",
        "Deprecation comms.",
        f"Task: {task or 'Run the deprecation-notice-drafter example.'}",
    ])

def create_deprecation_notice_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "deprecation-notice-drafter"}],
                "count": 1,
            },
        }
    }
