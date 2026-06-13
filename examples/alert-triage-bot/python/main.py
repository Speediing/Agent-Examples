from __future__ import annotations
import json, sys
from agent import build_alert_triage_bot_prompt

def main() -> int:
    text = " ".join(a for a in sys.argv[1:] if a not in {"--approve", "--reject", "--offline"})
    print(build_alert_triage_bot_prompt(text))
    print(json.dumps({"approved": "--approve" in sys.argv}, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
