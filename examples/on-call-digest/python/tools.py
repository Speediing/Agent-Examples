from __future__ import annotations

def build_on_call_digest_prompt(task: str) -> str:
    return "\n".join([
        "You are the On Call Digest.",
        "On-call digest.",
        f"Task: {task or 'Run the on-call-digest example.'}",
    ])

def create_on_call_digest_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "on-call-digest"}],
                "count": 1,
            },
        }
    }
