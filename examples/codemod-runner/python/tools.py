from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "codemod-runner"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "1", "kind": "codemod-runner", "summary": "Example drift record for audit"}],
        "count": 1,
        "writes_enabled": "--act" in sys.argv,
    }

def build_codemod_runner_prompt(task: str) -> str:
    return "\n".join([
        "You are the Codemod Runner.",
        "Codemod audit then act.",
        "Call audit_state first. Only recommend writes when audit_state.writes_enabled is true.",
        f"Task: {task or 'Audit scope for codemod-runner.'}",
    ])

def create_codemod_runner_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the codemod-runner example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
