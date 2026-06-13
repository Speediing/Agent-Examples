from __future__ import annotations

import json
import os
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RUNS_PATH = EXAMPLE_ROOT / "fixtures" / "ci-runs.json"


def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def _resolve_runs_path(override: str) -> Path:
    env = os.environ.get("CI_RUNS_PATH", "").strip()
    if override:
        return Path(override)
    if env:
        return Path(env)
    return DEFAULT_RUNS_PATH


def _compute_flake_rate(runs: list[dict[str, object]]) -> dict[str, object]:
    if not runs:
        return {
            "total_runs": 0,
            "failures": 0,
            "failure_rate": 0,
            "is_flaky": False,
        }
    failures = sum(1 for run in runs if not run.get("passed"))
    failure_rate = failures / len(runs)
    is_flaky = len(runs) >= 5 and 0.05 < failure_rate < 0.95
    return {
        "total_runs": len(runs),
        "failures": failures,
        "failure_rate": round(failure_rate, 3),
        "is_flaky": is_flaky,
    }


def analyze_ci_runs(args: dict[str, object]) -> dict[str, object]:
    test_file = _read_string(args.get("test_file")) or "payments.integration.test.ts"
    runs_path = _resolve_runs_path(_read_string(args.get("runs_path")))
    all_runs = json.loads(runs_path.read_text(encoding="utf-8"))
    runs = all_runs.get(test_file, [])
    stats = _compute_flake_rate(runs)
    actionable: list[dict[str, str]] = []
    if stats["is_flaky"]:
        slug = test_file.replace("/", "-").replace(".", "-")
        actionable.append(
            {
                "id": f"flake-{slug}",
                "kind": "test",
                "summary": (
                    f"{test_file} failed {stats['failures']} of last "
                    f"{stats['total_runs']} runs ({stats['failure_rate']} rate)"
                ),
            }
        )
    return {
        "test_file": test_file,
        "runs_path": str(runs_path),
        **stats,
        "actionable": actionable,
        "count": 1 if stats["is_flaky"] else 0,
        "writes_enabled": False,
    }


def build_flake_hunter_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Flake Hunter.",
            "CI-history flake audit.",
            "Call analyze_ci_runs first. Quarantine only when is_flaky is true.",
            "Cite failure_rate and run counts from tool output only.",
            f"Task: {task or 'Audit flaky tests from CI history.'}",
        ]
    )


def create_flake_hunter_custom_tools() -> dict[str, object]:
    return {
        "analyze_ci_runs": {
            "description": "Load CI run history from a fixture and compute flake rates per test file.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "test_file": {
                        "type": "string",
                        "description": "Test file path key in the CI runs fixture",
                    },
                    "runs_path": {
                        "type": "string",
                        "description": "Optional path to ci-runs.json",
                    },
                },
            },
            "execute": analyze_ci_runs,
        }
    }
