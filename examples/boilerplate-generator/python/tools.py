from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "boilerplate-generator"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "schema", "value": "RefundRequest table in prisma/schema.prisma"},
            {"key": "output_path", "value": "src/payments/refund-request/"}
        ],
        "count": 2,
    }

def build_boilerplate_generator_prompt(task: str) -> str:
    return "\n".join([
        "You are the Boilerplate Generator.",
        "Schema-driven codegen.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the boilerplate-generator example.'}",
    ])

def create_boilerplate_generator_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the boilerplate-generator example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
