from __future__ import annotations

def build_dependency_updater_prompt(task: str) -> str:
    return "\n".join([
        "You are the Dependency Updater.",
        "Dependency audit then act.",
        f"Task: {task or 'Run the dependency-updater example.'}",
    ])

def create_dependency_updater_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "dependency-updater"}],
                "count": 1,
            },
        }
    }
