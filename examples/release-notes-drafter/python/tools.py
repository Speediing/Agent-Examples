from __future__ import annotations

import json
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]


def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def list_release_inputs(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")).lower()
    if "on-call" in scope or "alert" in scope or "overnight" in scope:
        digest = json.loads(
            (EXAMPLE_ROOT / "fixtures" / "oncall-alerts.json").read_text(encoding="utf-8")
        )
        return {
            "mode": "on_call_digest",
            "window": digest["window"],
            "items": digest["alerts"],
            "count": len(digest["alerts"]),
        }
    release = json.loads(
        (EXAMPLE_ROOT / "fixtures" / "merged-prs.json").read_text(encoding="utf-8")
    )
    return {
        "mode": "release_notes",
        "since_tag": release["since_tag"],
        "until_tag": release["until_tag"],
        "items": release["merged_prs"],
        "count": len(release["merged_prs"]),
    }


def build_release_notes_drafter_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Release Notes Drafter.",
            "Scheduled digest writer.",
            "Call list_release_inputs first. Cite PR numbers or alert ids from tool output only.",
            f"Task: {task or 'Draft release notes or an on-call digest from fixture inputs.'}",
        ]
    )


def create_release_notes_drafter_custom_tools() -> dict[str, object]:
    return {
        "list_release_inputs": {
            "description": "Load merged PRs or on-call alerts from committed fixtures.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {
                        "type": "string",
                        "description": "Release tag range or on-call digest scope",
                    }
                },
            },
            "execute": list_release_inputs,
        }
    }
