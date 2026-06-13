from __future__ import annotations

def build_runbook_freshness_auditor_prompt(task: str) -> str:
    return "\n".join([
        "You are the Runbook Freshness Auditor.",
        "Runbook audit.",
        f"Task: {task or 'Run the runbook-freshness-auditor example.'}",
    ])

def create_runbook_freshness_auditor_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "runbook-freshness-auditor"}],
                "count": 1,
            },
        }
    }
