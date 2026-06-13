from __future__ import annotations

def build_security_review_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Security Review Agent.",
        "Security investigation gate.",
        f"Task: {task or 'Run the security-review-agent example.'}",
    ])

def create_security_review_agent_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "security-review-agent"}],
                "count": 1,
            },
        }
    }
