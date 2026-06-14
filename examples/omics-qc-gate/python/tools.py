"""Omics QC gate handlers (Python port)."""

from __future__ import annotations

from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
MATRIX_PATH = EXAMPLE_ROOT / "fixtures" / "counts-matrix.csv"


def _parse_counts_matrix(content: str) -> tuple[list[str], list[dict[str, object]]]:
    lines = content.strip().splitlines()
    headers = lines[0].split(",") if lines else []
    sample_columns = headers[1:]

    rows: list[dict[str, object]] = []
    for line in lines[1:]:
        values = line.split(",")
        rows.append(
            {
                "gene": values[0] if values else "",
                "counts": [int(value) for value in values[1:]],
            }
        )

    return sample_columns, rows


def run_omics_qc() -> dict[str, object]:
    content = MATRIX_PATH.read_text(encoding="utf-8")
    sample_columns, rows = _parse_counts_matrix(content)

    zero_genes = [
        row["gene"]
        for row in rows
        if all(count == 0 for count in row["counts"])  # type: ignore[union-attr]
    ]
    low_genes = [
        row["gene"]
        for row in rows
        if 0 < sum(row["counts"]) < 100  # type: ignore[arg-type]
    ]

    sample_totals = [
        {
            "sample": sample,
            "total_reads": sum(row["counts"][index] for row in rows),  # type: ignore[index]
        }
        for index, sample in enumerate(sample_columns)
    ]

    failed_samples = [
        entry["sample"] for entry in sample_totals if entry["total_reads"] < 500  # type: ignore[operator]
    ]

    passed = not zero_genes and not failed_samples

    return {
        "passed": passed,
        "gene_count": len(rows),
        "sample_count": len(sample_columns),
        "zero_expression_genes": zero_genes,
        "low_total_read_genes": low_genes,
        "failed_samples": failed_samples,
        "sample_totals": sample_totals,
    }


def build_omics_qc_gate_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Omics QC Gate.",
            "Call run_omics_qc and summarize failures using only tool JSON.",
            "Do not invent p-values, sample ids, or gene names.",
            f"Task: {task or 'Run QC on the counts matrix fixture.'}",
        ]
    )


def create_omics_qc_gate_custom_tools() -> dict[str, object]:
    return {
        "run_omics_qc": {
            "description": "Compute QC metrics on the synthetic counts matrix fixture.",
            "inputSchema": {"type": "object", "properties": {}},
            "execute": lambda _args=None: run_omics_qc(),
        }
    }
