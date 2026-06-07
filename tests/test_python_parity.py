from tools import run_add_tool, run_word_count_tool


def test_add_matches_typescript_shape() -> None:
    result = run_add_tool({"numbers": [3, 9]}, None)
    assert result == {"expression": "3 + 9", "total": 12}


def test_word_count_matches_typescript_shape() -> None:
    result = run_word_count_tool({"text": "one two three"}, None)
    assert result == {"count": 3}
