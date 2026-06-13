import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateBugbotDiff,
  resolveDiffPath as bugbotDiffPath,
} from "../examples/bugbot/ts/src/validate.js";
import {
  validateSecurityReviewerDiff,
  resolveDiffPath as securityDiffPath,
} from "../examples/security-reviewer/ts/src/validate.js";
import { repoRoot } from "./helpers.js";

describe("native builtin examples", () => {
  it("bugbot fixture flags idempotency and refund auth issues", () => {
    const diff = readFileSync(
      path.join(repoRoot, "examples/bugbot/fixtures/pr-idempotency-bug.diff"),
      "utf8",
    );
    const findings = validateBugbotDiff(diff);
    const rules = new Set(findings.map((finding) => finding.rule));

    expect(rules.has("unsafe-idempotency-key")).toBe(true);
    expect(rules.has("refund-missing-authorization")).toBe(true);
    expect(findings.some((finding) => finding.severity === "blocking")).toBe(
      true,
    );
  });

  it("security-reviewer fixture flags auth, secret, sql, and eval issues", () => {
    const diff = readFileSync(
      path.join(
        repoRoot,
        "examples/security-reviewer/fixtures/pr-auth-bypass.diff",
      ),
      "utf8",
    );
    const findings = validateSecurityReviewerDiff(diff);
    const rules = new Set(findings.map((finding) => finding.rule));

    expect(rules.has("auth-bypass")).toBe(true);
    expect(rules.has("hardcoded-secret")).toBe(true);
    expect(rules.has("sql-injection")).toBe(true);
    expect(rules.has("dangerous-eval")).toBe(true);
  });

  it("ships BUGBOT.md and Security Reviewer config templates", () => {
    expect(
      readFileSync(
        path.join(repoRoot, "examples/bugbot/.cursor/BUGBOT.md"),
        "utf8",
      ),
    ).toContain("idempotency");
    expect(
      readFileSync(
        path.join(
          repoRoot,
          "examples/security-reviewer/config/custom-instructions.md",
        ),
        "utf8",
      ),
    ).toContain("Security Reviewer");
  });

  it("resolves default fixture paths", () => {
    expect(bugbotDiffPath()).toContain("pr-idempotency-bug.diff");
    expect(securityDiffPath()).toContain("pr-auth-bypass.diff");
  });
});
