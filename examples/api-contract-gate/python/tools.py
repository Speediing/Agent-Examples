from __future__ import annotations

def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""

def scan_target(args: dict[str, object]) -> dict[str, object]:
    target = _read_string(args.get("target")) or "sample-input"
    return {
        "target": target,
        "violations": [
            {
                "id": "api-contract-gate-rule-1",
                "impact": "moderate",
                "summary": "Example violation for api-contract-gate",
            }
        ],
        "count": 1,
        "passed": False,
    }

def build_api_contract_gate_prompt(task: str) -> str:
    return "\n".join([
        "You are the Api Contract Gate.",
        "Contract scan gate.",
        "Call scan_target and cite violation ids from the tool result.",
        f"Task: {task or 'Scan the sample input for api-contract-gate.'}",
    ])

def create_api_contract_gate_custom_tools() -> dict[str, object]:
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
