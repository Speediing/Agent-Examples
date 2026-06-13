from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "estimation-helper"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "touched_paths", "value": "src/payments/, src/checkout/, openapi/payments.yaml"},
            {"key": "estimate", "value": "3-5 days with test coverage"}
        ],
        "count": 2,
    }

def build_estimation_helper_prompt(task: str) -> str:
    return "\n".join([
        "You are the Estimation Helper.",
        "Estimation with file evidence.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the estimation-helper example.'}",
    ])

def create_estimation_helper_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the estimation-helper example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
