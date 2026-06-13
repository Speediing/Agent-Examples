#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from validate import format_findings, resolve_diff_path, validate_bugbot_diff


def main() -> int:
    diff_arg = sys.argv[1] if len(sys.argv) > 1 else None
    diff_path = resolve_diff_path(diff_arg)
    diff = diff_path.read_text(encoding="utf-8")
    findings = validate_bugbot_diff(diff)

    print(f"Validated: {diff_path}")
    print(format_findings(findings))
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
