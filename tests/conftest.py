import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PYTHON = ROOT / "examples" / "migration-agent" / "python"

sys.path.insert(0, str(MIGRATION_PYTHON))
