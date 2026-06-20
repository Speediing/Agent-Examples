"""Sample ID reconciler handlers (Python port)."""

from __future__ import annotations

import csv
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
FIXTURE_DIR = EXAMPLE_ROOT / "fixtures"


def _parse_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def reconcile_sample_ids() -> dict[str, object]:
    lims = _parse_csv(FIXTURE_DIR / "lims.csv")
    metadata = _parse_csv(FIXTURE_DIR / "metadata.csv")
    warehouse = _parse_csv(FIXTURE_DIR / "warehouse.csv")

    barcode_to_lims: dict[str, list[str]] = {}
    for row in lims:
        barcode_to_lims.setdefault(row["barcode"], []).append(row["sample_id"])

    duplicate_barcodes = [
        {"barcode": barcode, "sample_ids": ids}
        for barcode, ids in barcode_to_lims.items()
        if len(ids) > 1
    ]

    warehouse_ids = {row["sample_id"] for row in warehouse}
    lims_ids = {row["sample_id"] for row in lims}
    warehouse_only = sorted(warehouse_ids - lims_ids)
    lims_only = sorted(lims_ids - warehouse_ids)

    metadata_barcodes = [row["barcode"] for row in metadata]
    metadata_dupes = sorted(
        {barcode for barcode in metadata_barcodes if metadata_barcodes.count(barcode) > 1}
    )

    passed = (
        not duplicate_barcodes
        and not warehouse_only
        and not lims_only
        and not metadata_dupes
    )

    return {
        "passed": passed,
        "counts": {
            "lims_rows": len(lims),
            "metadata_rows": len(metadata),
            "warehouse_rows": len(warehouse),
        },
        "duplicate_barcodes": duplicate_barcodes,
        "warehouse_only_sample_ids": warehouse_only,
        "lims_only_sample_ids": lims_only,
        "metadata_duplicate_barcodes": metadata_dupes,
    }


def build_sample_id_reconciler_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Sample ID Reconciler.",
            "Call reconcile_sample_ids and explain collisions using only tool JSON.",
            "Do not invent sample ids or barcodes.",
            f"Task: {task or 'Reconcile sample ids across LIMS, metadata, and warehouse exports.'}",
        ]
    )


def create_sample_id_reconciler_custom_tools() -> dict[str, object]:
    return {
        "reconcile_sample_ids": {
            "description": "Match barcodes and sample ids across fixture CSVs.",
            "inputSchema": {"type": "object", "properties": {}},
            "execute": lambda _args=None: reconcile_sample_ids(),
        }
    }
