from __future__ import annotations

import json
import os
import sys

from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

from tools import (
    build_omics_qc_gate_prompt,
    create_omics_qc_gate_custom_tools,
    run_omics_qc,
)


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}.")
    return value


def main() -> int:
    args = sys.argv[1:]
    scan_only = "--scan-only" in args
    task = " ".join(arg for arg in args if arg != "--scan-only").strip()

    if scan_only:
        result = run_omics_qc()
        print(json.dumps(result, indent=2))
        return 0 if result["passed"] else 1

    response = Agent.prompt(
        build_omics_qc_gate_prompt(task),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(
                cwd=os.getcwd(),
                custom_tools=create_omics_qc_gate_custom_tools(),
            ),
        ),
    )
    print(response.result)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
