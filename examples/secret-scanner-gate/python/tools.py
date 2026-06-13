from __future__ import annotations

def build_secret_scanner_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Secret Scanner Gate.",
        "Secret scan gate.",
        f"Task: {task or 'Run the secret-scanner-gate example.'}",
    ])

def create_secret_scanner_gate_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "secret-scanner-gate"}],
                "count": 1,
            },
        }
    }
