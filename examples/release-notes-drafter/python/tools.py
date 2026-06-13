from __future__ import annotations

def build_release_notes_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Release Notes Drafter.",
        "Release notes writer.",
        f"Task: {task or 'Run the release-notes-drafter example.'}",
    ])

def create_release_notes_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "release-notes-drafter"}],
                "count": 1,
            },
        }
    }
