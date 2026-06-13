from __future__ import annotations

def build_rollout_watcher_prompt(task: str) -> str:
    return "\n".join([
        "You are the Rollout Watcher.",
        "Deploy investigation gate.",
        f"Task: {task or 'Run the rollout-watcher example.'}",
    ])

def create_rollout_watcher_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "rollout-watcher"}],
                "count": 1,
            },
        }
    }
