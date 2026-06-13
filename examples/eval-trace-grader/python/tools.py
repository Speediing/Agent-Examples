from __future__ import annotations

def build_eval_trace_grader_prompt(task: str) -> str:
    return "\n".join([
        "You are the Eval Trace Grader.",
        "Behavioral eval grader.",
        f"Task: {task or 'Run the eval-trace-grader example.'}",
    ])

def create_eval_trace_grader_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "eval-trace-grader"}],
                "count": 1,
            },
        }
    }
