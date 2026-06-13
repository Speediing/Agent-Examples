from __future__ import annotations

def build_cost_auditor_prompt(task: str) -> str:
    return "\n".join([
        "You are the Cost Auditor.",
        "Cost audit.",
        f"Task: {task or 'Run the cost-auditor example.'}",
    ])

def create_cost_auditor_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "cost-auditor"}],
                "count": 1,
            },
        }
    }
