from __future__ import annotations

def build_db_migration_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Db Migration Drafter.",
        "Gated migration drafts.",
        f"Task: {task or 'Run the db-migration-drafter example.'}",
    ])

def create_db_migration_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "db-migration-drafter"}],
                "count": 1,
            },
        }
    }
