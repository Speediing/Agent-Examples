from __future__ import annotations

def build_snapshot_reviewer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Snapshot Reviewer.",
        "Snapshot scan.",
        f"Task: {task or 'Run the snapshot-reviewer example.'}",
    ])

def create_snapshot_reviewer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "snapshot-reviewer"}],
                "count": 1,
            },
        }
    }
