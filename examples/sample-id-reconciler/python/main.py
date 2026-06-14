from __future__ import annotations

import json
import os
import sys

from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

from tools import (
    build_sample_id_reconciler_prompt,
    create_sample_id_reconciler_custom_tools,
    reconcile_sample_ids,
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
        result = reconcile_sample_ids()
        print(json.dumps(result, indent=2))
        return 0 if result["passed"] else 1

    response = Agent.prompt(
        build_sample_id_reconciler_prompt(task),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(
                cwd=os.getcwd(),
                custom_tools=create_sample_id_reconciler_custom_tools(),
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
