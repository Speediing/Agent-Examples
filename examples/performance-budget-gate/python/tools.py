from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def scan_target(args: dict[str, object]) -> dict[str, object]:
    target = _read_string(args.get("target")) or "sample-input"
    return {
        "target": target,
        "violations": [
            {
                "id": "performance-budget-gate-rule-1",
                "impact": "moderate",
                "summary": "Example violation for performance-budget-gate",
            }
        ],
        "count": 1,
        "passed": False,
    }

def build_performance_budget_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Performance Budget Gate.",
        "Perf budget scan.",
        "Call scan_target and cite violation ids from the tool result.",
        f"Task: {task or 'Scan the sample input for performance-budget-gate.'}",
    ])

def create_performance_budget_gate_custom_tools() -> dict[str, object]:
    return {
        "scan_target": {
            "description": "Scan the target input and return structured violations.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Path, diff snippet, or label to scan"},
                },
            },
            "execute": scan_target,
        }
    }
