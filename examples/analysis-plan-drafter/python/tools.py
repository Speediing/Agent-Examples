"""Analysis plan drafter handlers (Python port)."""

from __future__ import annotations

import json
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
FIXTURE_DIR = EXAMPLE_ROOT / "fixtures"


def load_study_context() -> dict[str, object]:
    metadata = json.loads(
        (FIXTURE_DIR / "study-metadata.json").read_text(encoding="utf-8")
    )
    prior_sap_path = metadata.get("prior_sap_path", "prior-sap.md")
    prior_sap = (FIXTURE_DIR / prior_sap_path).read_text(encoding="utf-8")

    return {
        "study_id": metadata.get("study_id"),
        "phase": metadata.get("phase"),
        "modality": metadata.get("modality"),
        "arms": metadata.get("arms", []),
        "primary_endpoint": metadata.get("primary_endpoint"),
        "prior_sap_excerpt": "\n".join(prior_sap.splitlines()[:12]),
        "draft_gate": "Draft only. A statistician must approve before submission.",
    }


def build_analysis_plan_drafter_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Analysis Plan Drafter.",
            "Call load_study_context and draft SAP sections grounded in the returned JSON.",
            "Do not invent endpoints, arms, or methods not present in tool output.",
            f"Task: {task or 'Draft an analysis plan outline for STUDY-042.'}",
        ]
    )


def create_analysis_plan_drafter_custom_tools() -> dict[str, object]:
    return {
        "load_study_context": {
            "description": "Load study metadata and a prior SAP excerpt from fixtures.",
            "inputSchema": {"type": "object", "properties": {}},
            "execute": lambda _args=None: load_study_context(),
        }
    }
