from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path

from cursor_sdk import Agent, AgentOptions, LocalAgentOptions


@dataclass(frozen=True)
class MigrationResult:
    status: str
    example: str
    message: str


ROOT_DIR = Path(__file__).resolve().parents[3]
EXAMPLES_DIR = ROOT_DIR / "examples"


def audit_python_ports(write_stubs: bool) -> list[MigrationResult]:
    results: list[MigrationResult] = []

    for example_dir in sorted(EXAMPLES_DIR.iterdir()):
        ts_dir = example_dir / "ts"
        package_json_path = ts_dir / "package.json"

        if not package_json_path.exists():
            results.append(
                MigrationResult(
                    status="error",
                    example=example_dir.name,
                    message="missing ts/package.json",
                )
            )
            continue

        try:
            package_json = json.loads(package_json_path.read_text())
        except json.JSONDecodeError:
            results.append(
                MigrationResult(
                    status="error",
                    example=example_dir.name,
                    message="invalid ts/package.json",
                )
            )
            continue

        python_port = package_json.get("cursorExample", {}).get("pythonPort")

        if not python_port:
            results.append(
                MigrationResult(
                    status="error",
                    example=example_dir.name,
                    message="missing cursorExample.pythonPort in ts/package.json",
                )
            )
            continue

        python_port_path = (ts_dir / python_port).resolve()
        ts_files = [
            path
            for path in ts_dir.rglob("*")
            if path.suffix in {".ts", ".json"} and path.is_file()
        ]
        latest_ts_mtime = max(
            (path.stat().st_mtime for path in ts_files),
            default=0,
        )

        if not python_port_path.exists():
            if write_stubs:
                write_python_stub(example_dir.name, python_port_path)

            results.append(
                MigrationResult(
                    status="created" if write_stubs else "missing",
                    example=example_dir.name,
                    message=relative_path(python_port_path),
                )
            )
            continue

        is_stale = latest_ts_mtime > python_port_path.stat().st_mtime
        results.append(
            MigrationResult(
                status="stale" if is_stale else "ok",
                example=example_dir.name,
                message=(
                    f"{relative_path(python_port_path)} is older than the TypeScript source"
                    if is_stale
                    else f"{relative_path(python_port_path)} is current"
                ),
            )
        )

    return results


def write_python_stub(example_name: str, target_path: Path) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(
        "\n".join(
            [
                '"""Python port placeholder.',
                "",
                f"Port the canonical TypeScript implementation from examples/{example_name}/ts.",
                '"""',
                "",
                "",
                "def main() -> None:",
                '    raise NotImplementedError("Port the TypeScript example first.")',
                "",
                "",
                'if __name__ == "__main__":',
                "    main()",
                "",
            ]
        )
    )


def print_results(results: list[MigrationResult]) -> None:
    for result in results:
        print(f"{result.status.upper().ljust(7)} {result.example}: {result.message}")


def has_failures(results: list[MigrationResult]) -> bool:
    return any(result.status in {"error", "missing", "stale"} for result in results)


def run_cursor_sdk_migration(results: list[MigrationResult]) -> None:
    actionable_results = [
        result for result in results if result.status in {"missing", "stale"}
    ]

    if not actionable_results:
        print("SKIPPED Cursor SDK migration: all Python ports are current.")
        return

    if not os.getenv("CURSOR_API_KEY"):
        print(
            "SKIPPED Cursor SDK migration: set CURSOR_API_KEY to let the Migration Agent update Python ports."
        )
        return

    if not os.getenv("CURSOR_MODEL"):
        print("SKIPPED Cursor SDK migration: set CURSOR_MODEL to choose the SDK model.")
        return

    prompt = "\n\n".join(
        [
            "You are the Migration Agent for this examples repository.",
            "TypeScript examples are canonical. Python ports must match their behavior.",
            "For each stale or missing Python port below, inspect the TypeScript implementation and update or create the matching Python port.",
            "Use the Python Cursor SDK in Python ports, mirroring the TypeScript Cursor SDK pattern.",
            "After editing, run the relevant Python file and report what changed.",
            json.dumps([result.__dict__ for result in actionable_results], indent=2),
        ]
    )
    result = Agent.prompt(
        prompt,
        AgentOptions(
            api_key=os.environ["CURSOR_API_KEY"],
            model=os.environ["CURSOR_MODEL"],
            local=LocalAgentOptions(cwd=str(ROOT_DIR)),
        ),
    )

    print("\nCursor SDK migration result:")
    print(result.result)


def relative_path(path: Path) -> str:
    return os.path.relpath(path, ROOT_DIR)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Migration Agent Python port for auditing TS example parity. "
            "SDK updates use the Python Cursor SDK."
        )
    )
    parser.add_argument("--write-stubs", action="store_true")
    parser.add_argument("--use-cursor-sdk", action="store_true")
    args = parser.parse_args()

    results = audit_python_ports(write_stubs=args.write_stubs)
    print_results(results)

    if args.use_cursor_sdk:
        run_cursor_sdk_migration(results)

    return 1 if has_failures(results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
