from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class ToolResult:
    tool: str
    result: str


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    can_handle: Callable[[str], bool]
    run: Callable[[str], ToolResult]


def extract_numbers(text: str) -> list[float]:
    return [float(match) for match in re.findall(r"-?\d+(?:\.\d+)?", text)]


def format_number(value: float) -> str:
    return str(int(value)) if value.is_integer() else str(value)


def run_add_tool(prompt: str) -> ToolResult:
    numbers = extract_numbers(prompt)
    total = sum(numbers)
    rendered_numbers = " + ".join(format_number(number) for number in numbers)

    return ToolResult(
        tool="add",
        result=f"{rendered_numbers} = {format_number(total)}",
    )


def run_word_count_tool(prompt: str) -> ToolResult:
    words = [word for word in re.split(r"\s+", prompt.strip()) if word]

    return ToolResult(
        tool="word_count",
        result=f"{len(words)} words",
    )


TOOLS = [
    Tool(
        name="add",
        description="Adds every number found in the prompt.",
        can_handle=lambda prompt: re.search(r"\b(add|sum|plus)\b", prompt, re.I)
        is not None,
        run=run_add_tool,
    ),
    Tool(
        name="word_count",
        description="Counts words in the prompt.",
        can_handle=lambda prompt: re.search(r"\b(count|words?)\b", prompt, re.I)
        is not None,
        run=run_word_count_tool,
    ),
]


def run_agent(prompt: str) -> str:
    selected_tool = next((tool for tool in TOOLS if tool.can_handle(prompt)), None)

    if selected_tool is None:
        available_tools = "; ".join(
            f"{tool.name}: {tool.description}" for tool in TOOLS
        )
        return f"No tool selected. Available tools: {available_tools}"

    tool_result = selected_tool.run(prompt)
    return f"Used {tool_result.tool}: {tool_result.result}"


if __name__ == "__main__":
    user_prompt = " ".join(sys.argv[1:])
    print(run_agent(user_prompt))
