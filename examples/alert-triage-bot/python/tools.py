from __future__ import annotations

def build_alert_triage_bot_prompt(thread_text: str) -> str:
    return "\n".join([
        "You are the Alert Triage Bot.",
        "Alert triage chat.",
        "Do not claim you created a ticket or opened a pull request.",
        f"Thread:\n{thread_text or 'Example alert-triage-bot thread.'}",
    ])
