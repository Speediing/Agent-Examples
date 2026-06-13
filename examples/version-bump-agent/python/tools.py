from __future__ import annotations

def build_version_bump_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Version Bump Agent.",
        "Gated version bumps.",
        f"Task: {task or 'Run the version-bump-agent example.'}",
    ])

def create_version_bump_agent_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "version-bump-agent"}],
                "count": 1,
            },
        }
    }
