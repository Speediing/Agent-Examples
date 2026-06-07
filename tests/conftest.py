import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PYTHON = ROOT / "examples" / "migration-agent" / "python"
TOOL_CALLING_PYTHON = ROOT / "examples" / "tool-calling-agent" / "python"

sys.path.insert(0, str(MIGRATION_PYTHON))
sys.path.insert(0, str(TOOL_CALLING_PYTHON))
