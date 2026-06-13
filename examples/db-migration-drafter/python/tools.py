from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "db-migration-drafter"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "column", "value": "orders.refund_status varchar(32)"},
            {"key": "migration_file", "value": "migrations/20260301_add_refund_status.sql"}
        ],
        "count": 2,
    }

def build_db_migration_drafter_prompt(task: str) -> str:
    return "\n".join([
        "You are the DB Migration Drafter.",
        "Gated migration drafts.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the db-migration-drafter example.'}",
    ])

def create_db_migration_drafter_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the db-migration-drafter example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
