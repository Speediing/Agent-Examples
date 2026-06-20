"""Dataset freshness monitor handlers (Python port)."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = EXAMPLE_ROOT / "fixtures" / "datasets.json"


def _hours_between(start_iso: str, end_iso: str) -> float:
    start = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
    return (end - start).total_seconds() / (60 * 60)


def check_dataset_freshness() -> dict[str, object]:
    records = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    breaches = [
        {
            "dataset": record["dataset"],
            "owner": record["owner"],
            "sla_hours": record["sla_hours"],
            "age_hours": round(_hours_between(record["last_landed_at"], record["as_of"]), 1),
            "breached": _hours_between(record["last_landed_at"], record["as_of"])
            > record["sla_hours"],
        }
        for record in records
    ]
    breaches = [entry for entry in breaches if entry["breached"]]

    return {
        "passed": len(breaches) == 0,
        "dataset_count": len(records),
        "breaches": breaches,
        "checked_at": records[0]["as_of"] if records else None,
    }


def build_dataset_freshness_monitor_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Dataset Freshness Monitor.",
            "Call check_dataset_freshness and triage SLA breaches using only tool JSON.",
            "Recommend an owner from the tool output for each breach.",
            f"Task: {task or 'Check dataset landing SLAs.'}",
        ]
    )


def create_dataset_freshness_monitor_custom_tools() -> dict[str, object]:
    return {
        "check_dataset_freshness": {
            "description": "Compare dataset landing times against SLA thresholds in fixtures.",
            "inputSchema": {"type": "object", "properties": {}},
            "execute": lambda _args=None: check_dataset_freshness(),
        }
    }
