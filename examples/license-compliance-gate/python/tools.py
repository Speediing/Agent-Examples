from __future__ import annotations

def build_license_compliance_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the License Compliance Gate.",
        "License audit gate.",
        f"Task: {task or 'Run the license-compliance-gate example.'}",
    ])

def create_license_compliance_gate_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "license-compliance-gate"}],
                "count": 1,
            },
        }
    }
