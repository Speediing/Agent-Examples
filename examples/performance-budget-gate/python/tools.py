from __future__ import annotations

def build_performance_budget_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Performance Budget Gate.",
        "Perf budget scan.",
        f"Task: {task or 'Run the performance-budget-gate example.'}",
    ])

def create_performance_budget_gate_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "performance-budget-gate"}],
                "count": 1,
            },
        }
    }
