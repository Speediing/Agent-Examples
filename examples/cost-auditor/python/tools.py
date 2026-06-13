from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "cost-auditor"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "cost-ec2-spike", "kind": "cost", "summary": "EC2 spend +34% week-over-week in us-east-1"}],
        "count": 1,
        "writes_enabled": False,
    }

def build_cost_auditor_prompt(task: str) -> str:
    return "\n".join([
        "You are the Cost Auditor.",
        "Cost audit.",
        "Call audit_state first. This example is audit-only.",
        f"Task: {task or 'Audit scope for cost-auditor.'}",
    ])

def create_cost_auditor_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the cost-auditor example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
