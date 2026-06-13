from __future__ import annotations

import sys

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "feature-flag-reaper"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "1", "kind": "feature-flag-reaper", "summary": "Example drift record for audit"}],
        "count": 1,
        "writes_enabled": "--act" in sys.argv,
    }

def build_feature_flag_reaper_prompt(task: str) -> str:
    return "\n".join([
        "You are the Feature Flag Reaper.",
        "Flag cleanup audit.",
        "Call audit_state first. Only recommend writes when audit_state.writes_enabled is true.",
        f"Task: {task or 'Audit scope for feature-flag-reaper.'}",
    ])

def create_feature_flag_reaper_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the feature-flag-reaper example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
