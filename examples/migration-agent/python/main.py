from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path


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


def relative_path(path: Path) -> str:
    return os.path.relpath(path, ROOT_DIR)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Migration Agent Python port for auditing TS example parity. "
            "SDK updates, package validation, and model selection live in the TS version."
        )
    )
    parser.add_argument("--write-stubs", action="store_true")
    args = parser.parse_args()

    results = audit_python_ports(write_stubs=args.write_stubs)
    print_results(results)

    return 1 if has_failures(results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
