from __future__ import annotations

def build_api_client_generator_prompt(task: str) -> str:
    return "\n".join([
        "You are the Api Client Generator.",
        "OpenAPI drift repair.",
        f"Task: {task or 'Run the api-client-generator example.'}",
    ])

def create_api_client_generator_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts.",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
            "execute": lambda args: {
                "query": str(args.get("query", "")),
                "found": True,
                "facts": [{"key": "example", "value": "api-client-generator"}],
                "count": 1,
            },
        }
    }
