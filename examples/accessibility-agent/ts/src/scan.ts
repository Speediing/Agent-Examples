import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AccessibilityViolation = {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodeCount: number;
  targets: string[];
};

export type ScanResult = {
  url: string;
  violationCount: number;
  violations: AccessibilityViolation[];
};

const exampleDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const defaultFixturePath = path.join(
  exampleDir,
  "fixtures/page-with-issues.html"
);

export function defaultFixtureUrl(): string {
  return pathToFileURL(defaultFixturePath).href;
}

export function resolveTargetUrl(input: string | undefined): string {
  if (!input) {
    return defaultFixtureUrl();
  }

  if (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    input.startsWith("file://")
  ) {
    return input;
  }

  return pathToFileURL(path.resolve(input)).href;
}

export async function scanAccessibility(url: string): Promise<ScanResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
    deviceScaleFactor: 1,
    viewport: { width: 1280, height: 720 }
  });

  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const axeResults = await new AxeBuilder({ page }).analyze();

    return {
      url,
      violationCount: axeResults.violations.length,
      violations: axeResults.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact ?? null,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodeCount: violation.nodes.length,
        targets: violation.nodes.flatMap((node) =>
          node.target.map((target) => String(target))
        )
      }))
    };
  } finally {
    await context.close();
    await browser.close();
  }
}
