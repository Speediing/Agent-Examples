import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type BugbotFinding = {
  rule: string;
  severity: "blocking" | "non-blocking";
  title: string;
  path: string;
  detail: string;
};

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function resolveDiffPath(override?: string): string {
  const trimmed = override?.trim();
  if (trimmed) {
    return path.isAbsolute(trimmed)
      ? trimmed
      : path.resolve(process.cwd(), trimmed);
  }

  return path.join(exampleRoot, "fixtures/pr-idempotency-bug.diff");
}

export function listChangedFiles(diff: string): string[] {
  const files = new Set<string>();

  for (const line of diff.split("\n")) {
    const match = line.match(/^\+\+\+ b\/(.+)$/);
    if (match?.[1] && match[1] !== "/dev/null") {
      files.add(match[1]);
    }
  }

  return [...files];
}

export function addedLinesForFile(diff: string, filePath: string): string[] {
  const lines: string[] = [];
  let currentFile: string | null = null;
  let inHunk = false;

  for (const line of diff.split("\n")) {
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch?.[1]) {
      currentFile = fileMatch[1];
      inHunk = false;
      continue;
    }

    if (line.startsWith("@@")) {
      inHunk = currentFile === filePath;
      continue;
    }

    if (!inHunk || currentFile !== filePath) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      lines.push(line.slice(1));
    }
  }

  return lines;
}

export function validateBugbotDiff(diff: string): BugbotFinding[] {
  const findings: BugbotFinding[] = [];
  const changedFiles = listChangedFiles(diff);
  const paymentsChanged = changedFiles.some((file) =>
    file.startsWith("src/payments/"),
  );
  const paymentsTestsChanged = changedFiles.some((file) =>
    file.startsWith("tests/payments/"),
  );

  const checkoutAdds = addedLinesForFile(diff, "src/payments/checkout.ts");
  const checkoutText = checkoutAdds.join("\n");

  if (
    /idempotencyKey:\s*token\b/.test(checkoutText) ||
    /idempotencyKey:\s*[^,}\n]+token/.test(checkoutText)
  ) {
    findings.push({
      rule: "unsafe-idempotency-key",
      severity: "blocking",
      title: "Unsafe idempotency key",
      path: "src/payments/checkout.ts",
      detail:
        "Client token reused as idempotencyKey. Generate a server-side UUID instead.",
    });
  }

  if (
    paymentsChanged &&
    /gateway\.refund|\/refunds/.test(checkoutText) &&
    !/authorize|ownership|role|permission/i.test(checkoutText)
  ) {
    findings.push({
      rule: "refund-missing-authorization",
      severity: "blocking",
      title: "Refund path missing authorization",
      path: "src/payments/checkout.ts",
      detail:
        "New refund path calls gateway.refund without an authorization check.",
    });
  }

  if (paymentsChanged && !paymentsTestsChanged) {
    findings.push({
      rule: "missing-payments-tests",
      severity: "blocking",
      title: "Missing payments tests",
      path: "src/payments/",
      detail:
        "Payment handler files changed without matching tests under tests/payments/.",
    });
  }

  return findings;
}

export async function loadDefaultDiff(): Promise<string> {
  return fs.readFile(resolveDiffPath(), "utf8");
}

export function formatFindings(findings: BugbotFinding[]): string {
  if (findings.length === 0) {
    return "No Bugbot rule violations detected in the fixture diff.";
  }

  return findings
    .map(
      (finding) =>
        `[${finding.severity}] ${finding.title}\n  rule: ${finding.rule}\n  path: ${finding.path}\n  ${finding.detail}`,
    )
    .join("\n\n");
}
