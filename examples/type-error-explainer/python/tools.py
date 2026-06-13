from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "type-error-explainer"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "error_code", "value": "TS2345 on src/payments/refund.ts:42"},
            {"key": "hint", "value": "Argument type RefundInput missing field currency"}
        ],
        "count": 2,
    }

def build_type_error_explainer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Type Error Explainer.",
        "Compiler output explainer.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the type-error-explainer example.'}",
    ])

def create_type_error_explainer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the type-error-explainer example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
