from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "flake-hunter"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "flake-payments-int", "kind": "flake", "summary": "payments.integration.test.ts failed 3/10 recent runs"}],
        "count": 1,
        "writes_enabled": False,
    }

def build_flake_hunter_prompt(task: str) -> str:
    return "\n".join([
        "You are the Flake Hunter.",
        "Flake audit.",
        "Call audit_state first. This example is audit-only.",
        f"Task: {task or 'Audit scope for flake-hunter.'}",
    ])

def create_flake_hunter_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the flake-hunter example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
