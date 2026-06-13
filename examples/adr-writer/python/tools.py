from __future__ import annotations

def build_adr_writer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Adr Writer.",
        "ADR from design discussion.",
        f"Task: {task or 'Run the adr-writer example.'}",
    ])

def create_adr_writer_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "adr-writer"}],
                "count": 1,
            },
        }
    }
