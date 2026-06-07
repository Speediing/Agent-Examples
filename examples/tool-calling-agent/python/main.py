from __future__ import annotations

import os
import sys
from pathlib import Path

from cursor_sdk import Agent, AgentOptions, CustomTool, LocalAgentOptions

from tools import run_add_tool, run_word_count_tool


ROOT_DIR = Path(__file__).resolve().parents[3]

CUSTOM_TOOLS = {
    "add": CustomTool(
        description="Adds a list of numbers.",
        input_schema={
            "type": "object",
            "properties": {
                "numbers": {
                    "type": "array",
                    "items": {"type": "number"},
                },
            },
            "required": ["numbers"],
        },
        execute=run_add_tool,
    ),
    "word_count": CustomTool(
        description="Counts words in a text string.",
        input_schema={
            "type": "object",
            "properties": {
                "text": {"type": "string"},
            },
            "required": ["text"],
        },
        execute=run_word_count_tool,
    ),
}


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def run_agent(prompt: str) -> str:
    result = Agent.prompt(
        "\n".join(
            [
                "You are the Tool Calling Agent.",
                "Use the available custom tools when they are relevant.",
                "Return a concise final answer that includes the tool result.",
                f"User request: {prompt or 'count the words in this default request'}",
            ]
        ),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(cwd=str(ROOT_DIR), custom_tools=CUSTOM_TOOLS),
        ),
    )
    return result.result or ""


if __name__ == "__main__":
    try:
        user_prompt = " ".join(sys.argv[1:]).strip()
        print(run_agent(user_prompt))
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
