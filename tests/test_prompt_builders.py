"""Tier 0 tests for the extracted Python prompt builders."""

from conftest import load_example_module

hello_world = load_example_module(
    "hello_world_agent", "examples/hello-world/python/agent.py"
)
accessibility = load_example_module(
    "accessibility_agent_prompt", "examples/accessibility-agent/python/agent.py"
)
migration_prompt = load_example_module(
    "migration_prompt", "examples/migration-agent/python/prompt.py"
)

from tools import build_tool_calling_prompt  # noqa: E402  (tool-calling via conftest path)


def test_hello_world_prompt_names_inventory_artifact() -> None:
    prompt = hello_world.build_inventory_prompt()
    assert "assessment.md" in prompt
    assert "Add codebase inventory" in prompt


def test_hello_world_prompt_is_deterministic() -> None:
    assert hello_world.build_inventory_prompt() == hello_world.build_inventory_prompt()


def test_accessibility_prompt_omits_empty_instructions() -> None:
    prompt = accessibility.build_accessibility_prompt("file:///tmp/page.html", "")
    assert prompt.endswith("Target URL: file:///tmp/page.html")
    assert "Additional instructions" not in prompt


def test_accessibility_prompt_includes_instructions() -> None:
    prompt = accessibility.build_accessibility_prompt(
        "file:///tmp/page.html", "focus on contrast"
    )
    assert prompt.endswith("Additional instructions: focus on contrast")


def test_migration_prompt_embeds_results_json() -> None:
    prompt = migration_prompt.build_migration_prompt(
        [{"status": "stale", "example": "sre-agent", "message": "is older"}]
    )
    assert "TypeScript examples are canonical." in prompt
    assert '"example": "sre-agent"' in prompt


def test_tool_calling_prompt_defaults_to_word_count_request() -> None:
    prompt = build_tool_calling_prompt("")
    assert "count the words in this default request" in prompt
