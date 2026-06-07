from __future__ import annotations

import subprocess
from pathlib import Path


def git_latest_commit_time_ms(file_path: Path, cwd: Path) -> float | None:
    try:
        relative_path = file_path.relative_to(cwd)
    except ValueError:
        relative_path = file_path

    result = subprocess.run(
        ["git", "log", "-1", "--format=%ct", "--", str(relative_path)],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        return None

    value = result.stdout.strip()
    if not value:
        return None

    try:
        return float(value) * 1000
    except ValueError:
        return None


def latest_source_signal(files: list[Path], cwd: Path) -> float:
    if not files:
        return 0.0

    signals: list[float] = []
    for path in files:
        git_signal = git_latest_commit_time_ms(path, cwd)
        if git_signal is not None:
            signals.append(git_signal)
        else:
            signals.append(path.stat().st_mtime * 1000)

    return max(signals)
