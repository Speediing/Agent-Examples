from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "license-compliance-gate"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "1", "kind": "license-compliance-gate", "summary": "Example drift record for audit"}],
        "count": 1,
        "writes_enabled": "--act" in sys.argv,
    }

def build_license_compliance_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the License Compliance Gate.",
        "License audit gate.",
        "Call audit_state first. This example is audit-only.",
        f"Task: {task or 'Audit scope for license-compliance-gate.'}",
    ])

def create_license_compliance_gate_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the license-compliance-gate example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
