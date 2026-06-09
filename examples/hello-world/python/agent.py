"""Prompt builder for the hello-world Python port.

Mirrors examples/hello-world/ts/src/agent.ts.
"""

from __future__ import annotations


def build_hello_world_prompt(name: str) -> str:
    recipient = name.strip() or "there"

    return "\n".join(
        [
            "You are the Hello World Agent.",
            f"Greet {recipient} in one short sentence.",
            "Mention that this is a Cursor SDK agent example.",
        ]
    )
