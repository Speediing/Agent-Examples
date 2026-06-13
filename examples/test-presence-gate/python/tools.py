from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def scan_target(args: dict[str, object]) -> dict[str, object]:
    target = _read_string(args.get("target")) or "sample-input"
    return {
        "target": target,
        "violations": [
            {
                "id": "test/missing-coverage",
                "path": "src/payments/refund.ts",
                "summary": "Application code changed without matching test file",
            }
        ],
        "count": 1,
        "passed": False,
    }

def build_test_presence_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Test Presence Gate.",
        "Test presence gate.",
        "Call scan_target and cite violation ids from the tool result.",
        f"Task: {task or 'Scan the sample input for test-presence-gate.'}",
    ])

def create_test_presence_gate_custom_tools() -> dict[str, object]:
    return {
        "scan_target": {
            "description": "Scan the target input and return structured violations.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Path, diff snippet, or label to scan"},
                },
            },
            "execute": scan_target,
        }
    }
