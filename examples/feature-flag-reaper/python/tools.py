from __future__ import annotations

def build_feature_flag_reaper_prompt(task: str) -> str:
    return "\n".join([
        "You are the Feature Flag Reaper.",
        "Flag cleanup audit.",
        f"Task: {task or 'Run the feature-flag-reaper example.'}",
    ])

def create_feature_flag_reaper_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "feature-flag-reaper"}],
                "count": 1,
            },
        }
    }
