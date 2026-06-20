"""Notebook-to-pipeline drafter handlers (Python port)."""

from __future__ import annotations

import json
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
FIXTURE_DIR = EXAMPLE_ROOT / "fixtures"


def load_notebook_draft() -> dict[str, object]:
    notebook = json.loads((FIXTURE_DIR / "notebook.json").read_text(encoding="utf-8"))
    manifest = json.loads((FIXTURE_DIR / "manifest.json").read_text(encoding="utf-8"))

    code_cells = [
        cell for cell in notebook.get("cells", []) if cell.get("cell_type") == "code"
    ]
    step_names = [f"step_{index + 1}" for index in range(len(code_cells))]

    rules: list[str] = [
        "config/config.yaml",
        *[f"results/{name}.done" for name in step_names],
        "rule all:\n    input:\n"
        + "\n".join(f'        "results/{name}.done"' for name in step_names),
    ]

    for index, cell in enumerate(code_cells):
        preview = "".join(cell.get("source", []))[:80].replace("\n", " ")
        rules.append(
            "\n".join(
                [
                    f"rule {step_names[index]}:",
                    "    output:",
                    f'        "results/{step_names[index]}.done"',
                    "    shell:",
                    (
                        f'        \'echo "TODO: port notebook cell {index + 1}: {preview}" > {{output}}\''
                    ),
                    "",
                ]
            )
        )

    return {
        "study_id": manifest.get("study_id", "unknown"),
        "input_files": [item["path"] for item in manifest.get("inputs", [])],
        "output_files": manifest.get("outputs", []),
        "notebook_code_cells": len(code_cells),
        "snakemake_skeleton": "\n\n".join(rules),
        "write_gate": "Human approval required before committing pipeline files.",
    }


def build_notebook_pipeline_drafter_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Notebook-to-Pipeline Drafter.",
            "Call draft_pipeline_skeleton and propose a Snakemake DAG from the notebook fixture.",
            "Treat snakemake_skeleton as a draft only. Remind the reader about write_gate.",
            f"Task: {task or 'Draft a Snakemake skeleton from the notebook fixture.'}",
        ]
    )


def create_notebook_pipeline_drafter_custom_tools() -> dict[str, object]:
    return {
        "draft_pipeline_skeleton": {
            "description": (
                "Read notebook + manifest fixtures and return a Snakemake skeleton string."
            ),
            "inputSchema": {"type": "object", "properties": {}},
            "execute": lambda _args=None: load_notebook_draft(),
        }
    }
