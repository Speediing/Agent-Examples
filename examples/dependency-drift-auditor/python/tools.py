from __future__ import annotations

def build_dependency_drift_auditor_prompt(task: str) -> str:
    return "\n".join([
        "You are the Dependency Drift Auditor.",
        "Lockfile drift audit.",
        f"Task: {task or 'Run the dependency-drift-auditor example.'}",
    ])

def create_dependency_drift_auditor_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "dependency-drift-auditor"}],
                "count": 1,
            },
        }
    }
