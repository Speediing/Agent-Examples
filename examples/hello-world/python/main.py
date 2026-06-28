from __future__ import annotations

import os
import sys

from cursor_sdk import Agent, AgentOptions

from agent import build_inventory_prompt


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def main() -> int:
    if len(sys.argv) < 2:
        print(
            "Usage: python main.py <owner>/<repo>",
            file=sys.stderr,
        )
        return 1
    target = sys.argv[1]
    result = Agent.prompt(
        build_inventory_prompt(),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            cloud={"repos": [{"name": target, "ref": "main"}]},
        ),
    )
    print(result.result)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
