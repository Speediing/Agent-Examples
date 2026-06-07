from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from playwright.sync_api import sync_playwright

EXAMPLE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = EXAMPLE_DIR.parents[1]
AXE_SCRIPT_PATH = ROOT_DIR / "node_modules" / "axe-core" / "axe.min.js"
DEFAULT_FIXTURE_PATH = EXAMPLE_DIR / "fixtures" / "page-with-issues.html"


@dataclass(frozen=True)
class AccessibilityViolation:
    id: str
    impact: str | None
    description: str
    help: str
    help_url: str
    node_count: int
    targets: list[str]


@dataclass(frozen=True)
class ScanResult:
    url: str
    violation_count: int
    violations: list[AccessibilityViolation]


def default_fixture_url() -> str:
    return DEFAULT_FIXTURE_PATH.resolve().as_uri()


def resolve_target_url(value: str | None) -> str:
    if not value:
        return default_fixture_url()

    if value.startswith(("http://", "https://", "file://")):
        return value

    return Path(value).resolve().as_uri()


def scan_accessibility(url: str) -> ScanResult:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded")
            page.add_script_tag(content=AXE_SCRIPT_PATH.read_text())
            raw_results: dict[str, Any] = page.evaluate(
                "async () => await axe.run(document, { resultTypes: ['violations'] })"
            )
        finally:
            browser.close()

    violations = [
        AccessibilityViolation(
            id=str(violation.get("id", "")),
            impact=violation.get("impact"),
            description=str(violation.get("description", "")),
            help=str(violation.get("help", "")),
            help_url=str(violation.get("helpUrl", "")),
            node_count=len(violation.get("nodes", [])),
            targets=[
                str(target)
                for node in violation.get("nodes", [])
                for target in node.get("target", [])
            ],
        )
        for violation in raw_results.get("violations", [])
    ]

    return ScanResult(
        url=url,
        violation_count=len(violations),
        violations=violations,
    )


def print_scan_result(result: ScanResult) -> None:
    print(f"Scanned: {result.url}")
    print(f"Violations: {result.violation_count}")

    for violation in result.violations:
        print()
        print(f"[{violation.impact or 'unknown'}] {violation.id}: {violation.help}")
        print(f"  {violation.description}")
        print(f"  Nodes: {violation.node_count}")
        for target in violation.targets[:3]:
            print(f"  - {target}")
        remaining = len(violation.targets) - 3
        if remaining > 0:
            print(f"  - ...and {remaining} more")

    if result.violation_count == 0:
        print("No automated accessibility violations found.")
    else:
        print()
        print(f"Fixture reference: {default_fixture_url()}")
