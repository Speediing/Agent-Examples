from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "prior-art-finder"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "module", "value": "src/payments/refund.ts"},
            {"key": "related_adr", "value": "docs/adr/014-refund-flow.md"}
        ],
        "count": 2,
    }

def build_prior_art_finder_prompt(task: str) -> str:
    return "\n".join([
        "You are the Prior Art Finder.",
        "Prior art search.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the prior-art-finder example.'}",
    ])

def create_prior_art_finder_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the prior-art-finder example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
