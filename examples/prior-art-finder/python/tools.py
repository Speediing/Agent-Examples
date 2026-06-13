from __future__ import annotations

def build_prior_art_finder_prompt(task: str) -> str:
    return "\n".join([
        "You are the Prior Art Finder.",
        "Prior art search.",
        f"Task: {task or 'Run the prior-art-finder example.'}",
    ])

def create_prior_art_finder_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "prior-art-finder"}],
                "count": 1,
            },
        }
    }
