from __future__ import annotations

SKIP_AUDIT_DIRS = frozenset({"node_modules", "dist"})


def classify_port_status(
    *,
    python_exists: bool,
    latest_ts_mtime: float,
    python_mtime: float,
    write_stubs: bool,
) -> str:
    if not python_exists:
        return "created" if write_stubs else "missing"

    return "stale" if latest_ts_mtime > python_mtime else "ok"


def should_skip_audit_dir(name: str) -> bool:
    return name in SKIP_AUDIT_DIRS
