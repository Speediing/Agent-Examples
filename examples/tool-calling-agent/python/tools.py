from __future__ import annotations

from typing import Any, Mapping


def format_number(number: int | float) -> str:
    if isinstance(number, float) and number.is_integer():
        return str(int(number))
    return str(number)


def run_add_tool(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    raw_numbers = args.get("numbers", [])
    numbers = [
        number
        for number in raw_numbers
        if isinstance(number, (int, float)) and not isinstance(number, bool)
    ]
    total = sum(numbers)

    return {
        "expression": " + ".join(format_number(number) for number in numbers),
        "total": total,
    }


def run_word_count_tool(args: Mapping[str, Any], _context: object) -> dict[str, int]:
    text = args.get("text", "")
    words = str(text).strip().split()

    return {"count": len(words)}


def build_tool_calling_prompt(prompt: str) -> str:
    return "\n".join(
        [
            "You are the Tool Calling Agent.",
            "Use the available custom tools when they are relevant.",
            "Return a concise final answer that includes the tool result.",
            f"User request: {prompt or 'count the words in this default request'}",
        ]
    )
