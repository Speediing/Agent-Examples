from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "scaffolding-agent"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "convention", "value": "payments/* modules use handler + schema pattern"},
            {"key": "target_path", "value": "src/payments/refund-handler/"}
        ],
        "count": 2,
    }

def build_scaffolding_agent_prompt(task: str) -> str:
    return "\n".join([
        "You are the Scaffolding Agent.",
        "Gated scaffolding.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the scaffolding-agent example.'}",
    ])

def create_scaffolding_agent_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the scaffolding-agent example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
