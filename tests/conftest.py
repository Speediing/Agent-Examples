from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PYTHON = ROOT / "examples" / "migration-agent" / "python"
TOOL_CALLING_PYTHON = ROOT / "examples" / "tool-calling-agent" / "python"

sys.path.insert(0, str(MIGRATION_PYTHON))
sys.path.insert(0, str(TOOL_CALLING_PYTHON))


def load_example_module(
    module_name: str, relative: str, package_dir: str | None = None
) -> ModuleType:
    """Load an example module under a unique name.

    Several examples ship files named tools.py or agent.py, so plain sys.path
    imports would collide. ``package_dir`` is temporarily added to sys.path for
    modules with sibling imports (for example sre tools importing mock_data).
    """
    path = ROOT / relative
    added = str(ROOT / package_dir) if package_dir else None
    if added:
        sys.path.insert(0, added)
    try:
        spec = importlib.util.spec_from_file_location(module_name, path)
        if spec is None or spec.loader is None:
            raise ImportError(f"cannot load {path}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module
    finally:
        if added:
            sys.path.remove(added)
