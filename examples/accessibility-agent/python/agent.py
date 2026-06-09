"""Prompt builder for the accessibility agent Python port.

Mirrors buildAccessibilityPrompt in examples/accessibility-agent/ts/src/agent.ts.
The custom tool wiring stays in main.py because it needs cursor_sdk, which is
not a test dependency.
"""

from __future__ import annotations


def build_accessibility_prompt(target_url: str, user_prompt: str) -> str:
    lines = [
        "You are the Accessibility Agent.",
        "Use the scan_accessibility tool to audit the target page for WCAG issues.",
        "If the target is a local HTML file in this repository, edit that file to fix violations you can address with markup changes, then call scan_accessibility again to verify the count dropped.",
        "For remote URLs, summarize findings by impact level, mention rule IDs, and list concrete fixes for a developer to apply.",
        "If there are no violations, say the page passed the automated scan.",
        "Return a short summary of what you found, what you changed (if anything), and the latest scan result.",
        f"Target URL: {target_url}",
        f"Additional instructions: {user_prompt}" if user_prompt else "",
    ]
    return "\n".join(line for line in lines if line)
