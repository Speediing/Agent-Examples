import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SecurityFinding = {
  rule: string;
  severity: "critical" | "high" | "medium";
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

  return path.join(exampleRoot, "fixtures/pr-auth-bypass.diff");
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

export function validateSecurityReviewerDiff(diff: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  const sessionAdds = addedLinesForFile(diff, "src/auth/session.ts").join("\n");
  if (
    /isAdmin\([\s\S]*null[\s\S]*return true/s.test(sessionAdds) ||
    /if\s*\(\s*!session\s*\)[\s\S]*return true/s.test(sessionAdds)
  ) {
    findings.push({
      rule: "auth-bypass",
      severity: "critical",
      title: "Admin check treats missing session as admin",
      path: "src/auth/session.ts",
      detail:
        "isAdmin returns true when session is null. Missing auth must deny access.",
    });
  }

  const refundAdds = addedLinesForFile(diff, "src/payments/refund.ts").join("\n");
  if (/sk_live_|api[_-]?key\s*=\s*["'][^"']+["']/i.test(refundAdds)) {
    findings.push({
      rule: "hardcoded-secret",
      severity: "critical",
      title: "Live API key committed to source",
      path: "src/payments/refund.ts",
      detail: "Gateway credential appears in source. Load from a secret manager.",
    });
  }

  if (/`[^`]*\$\{[^}]+\}[^`]*`/.test(refundAdds) && /SELECT|INSERT|UPDATE/i.test(refundAdds)) {
    findings.push({
      rule: "sql-injection",
      severity: "high",
      title: "User input concatenated into SQL",
      path: "src/payments/refund.ts",
      detail: "Build SQL with parameterized queries instead of template literals.",
    });
  }

  const adminAdds = addedLinesForFile(diff, "src/admin/tools.ts").join("\n");
  if (/\beval\s*\(/.test(adminAdds)) {
    findings.push({
      rule: "dangerous-eval",
      severity: "critical",
      title: "Agent tool executes arbitrary shell via eval",
      path: "src/admin/tools.ts",
      detail:
        "Admin tool uses eval on user-supplied command text. Remove or gate behind human approval.",
    });
  }

  return findings;
}

export async function loadDefaultDiff(): Promise<string> {
  return fs.readFile(resolveDiffPath(), "utf8");
}

export function formatFindings(findings: SecurityFinding[]): string {
  if (findings.length === 0) {
    return "No Security Reviewer rule violations detected in the fixture diff.";
  }

  return findings
    .map(
      (finding) =>
        `[${finding.severity}] ${finding.title}\n  rule: ${finding.rule}\n  path: ${finding.path}\n  ${finding.detail}`,
    )
    .join("\n\n");
}
