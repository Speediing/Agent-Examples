from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "backlog-groomer"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "1", "kind": "backlog-groomer", "summary": "Example drift record for audit"}],
        "count": 1,
        "writes_enabled": "--act" in sys.argv,
    }

def build_backlog_groomer_prompt(task: str) -> str:
    return "\n".join([
        "You are the Backlog Groomer.",
        "Scheduled backlog audit.",
        "Call audit_state first. This example is audit-only.",
        f"Task: {task or 'Audit scope for backlog-groomer.'}",
    ])

def create_backlog_groomer_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the backlog-groomer example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
