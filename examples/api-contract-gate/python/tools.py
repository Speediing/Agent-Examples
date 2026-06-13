from __future__ import annotations

def build_api_contract_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Api Contract Gate.",
        "Contract scan gate.",
        f"Task: {task or 'Run the api-contract-gate example.'}",
    ])

def create_api_contract_gate_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "api-contract-gate"}],
                "count": 1,
            },
        }
    }
