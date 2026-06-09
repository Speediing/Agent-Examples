from __future__ import annotations

import os
import sys
from pathlib import Path

from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

from agent import build_hello_world_prompt


ROOT_DIR = Path(__file__).resolve().parents[3]


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def main() -> int:
    name = " ".join(sys.argv[1:])
    result = Agent.prompt(
        build_hello_world_prompt(name),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(cwd=str(ROOT_DIR)),
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
