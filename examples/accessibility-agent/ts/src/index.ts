import { Agent } from "@cursor/sdk";
import {
  buildAccessibilityPrompt,
  createAccessibilityCustomTools
} from "./agent.js";
import {
  defaultFixtureUrl,
  resolveTargetUrl,
  scanAccessibility,
  type ScanResult
} from "./scan.js";

const args = process.argv.slice(2);
const scanOnly = args.includes("--scan-only");
const positionalArgs = args.filter((arg) => arg !== "--scan-only");

try {
  if (scanOnly) {
    const url = resolveTargetUrl(positionalArgs[0]);
    const result = await scanAccessibility(url);
    printScanResult(result);
    process.exit(result.violationCount > 0 ? 1 : 0);
  }

  const targetUrl = resolveTargetUrl(positionalArgs[0]);
  const userPrompt = positionalArgs.slice(1).join(" ").trim();
  const result = await Agent.prompt(
    buildAccessibilityPrompt(targetUrl, userPrompt),
    {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: {
        cwd: process.cwd(),
        customTools: createAccessibilityCustomTools(targetUrl)
      }
    }
  );

  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function printScanResult(result: ScanResult) {
  console.log(`Scanned: ${result.url}`);
  console.log(`Violations: ${result.violationCount}`);

  for (const violation of result.violations) {
    console.log("");
    console.log(
      `[${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}`
    );
    console.log(`  ${violation.description}`);
    console.log(`  Nodes: ${violation.nodeCount}`);
    for (const target of violation.targets.slice(0, 3)) {
      console.log(`  - ${target}`);
    }
    if (violation.targets.length > 3) {
      console.log(`  - ...and ${violation.targets.length - 3} more`);
    }
  }

  if (result.violationCount === 0) {
    console.log("No automated accessibility violations found.");
  } else if (result.url === defaultFixtureUrl()) {
    console.log("");
    console.log(`Fixture reference: ${defaultFixtureUrl()}`);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
