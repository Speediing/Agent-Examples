from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "dependency-drift-auditor"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "lockfile-drift", "kind": "lockfile", "summary": "package-lock differs from registry for 3 packages"}],
        "count": 1,
        "writes_enabled": False,
    }

def build_dependency_drift_auditor_prompt(task: str) -> str:
    return "\n".join([
        "You are the Dependency Drift Auditor.",
        "Lockfile drift audit.",
        "Call audit_state first. This example is audit-only.",
        f"Task: {task or 'Audit scope for dependency-drift-auditor.'}",
    ])

def create_dependency_drift_auditor_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the dependency-drift-auditor example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
