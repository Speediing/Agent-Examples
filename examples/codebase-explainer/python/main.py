from __future__ import annotations

import os
import sys
from pathlib import Path

from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

from agent import build_codebase_explainer_prompt
from tools import create_codebase_explainer_custom_tools


ROOT_DIR = Path(__file__).resolve().parents[1]


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def main() -> int:
    argv = sys.argv[1:]
    module_path = argv[0] if argv else "examples/hello-world"
    question = " ".join(argv[1:]).strip()
    result = Agent.prompt(
        build_codebase_explainer_prompt(module_path, question),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(
                cwd=str(ROOT_DIR),
                custom_tools=create_codebase_explainer_custom_tools(ROOT_DIR),
            ),
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
