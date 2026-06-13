from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "codeowners-router"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "example", "value": "codeowners-router"},
            {"key": "lesson", "value": "Reviewer routing"},
            {"key": "pattern", "value": "local-tools"},
        ],
        "count": 3,
    }

def build_codeowners_router_prompt(task: str) -> str:
    return "\n".join([
        "You are the Codeowners Router.",
        "Reviewer routing.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the codeowners-router example.'}",
    ])

def create_codeowners_router_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the codeowners-router example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
