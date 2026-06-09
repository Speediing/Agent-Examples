"""Migration prompt builder for the Python port.

Mirrors buildMigrationPrompt in examples/migration-agent/ts/src/prompt.ts.
"""

from __future__ import annotations

import json
from typing import Any, Mapping, Sequence


def build_migration_prompt(actionable_results: Sequence[Mapping[str, Any]]) -> str:
    return "\n\n".join(
        [
            "You are the Migration Agent for this examples repository.",
            "TypeScript examples are canonical. Python ports must match their behavior.",
            "For each stale or missing Python port below, inspect the TypeScript implementation and update or create the matching Python port.",
            "Use the Python Cursor SDK in Python ports, mirroring the TypeScript Cursor SDK pattern.",
            "After editing, run the relevant Python file and report what changed.",
            json.dumps([dict(result) for result in actionable_results], indent=2),
        ]
    )
