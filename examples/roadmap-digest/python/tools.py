from __future__ import annotations

def build_roadmap_digest_prompt(task: str) -> str:
    return "\n".join([
        "You are the Roadmap Digest.",
        "Scheduled digest writer.",
        f"Task: {task or 'Run the roadmap-digest example.'}",
    ])

def create_roadmap_digest_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "roadmap-digest"}],
                "count": 1,
            },
        }
    }
