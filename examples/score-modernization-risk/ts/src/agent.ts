export function buildRiskScorePrompt(): string {
  return [
    "You are the risk-scoring agent.",
    "Goal: write a deterministic risk score for the repo and commit it.",
    "",
    "Steps:",
    "  1. Write scripts/score-risk.ts that exports scoreRisk(manifests).",
    "  2. The scoring rules:",
    "      - .NET Framework manifests: +4 each",
    "      - Java 8 (1.8) manifests:  +3 each",
    "      - Node engines < 18:        +2 each",
    "      - 'unknown' version fields: +2 each",
    "     Severity: high (>=5), medium (2-4), low (<2).",
    "  3. Run the script against the actual manifests in the repo.",
    "  4. Write the score, severity, and top three blockers to risk.md.",
    "",
    "Open a PR titled 'Add modernization risk score'.",
    "The scoring rules belong in scripts/score-risk.ts. Do not put them in prose."
  ].join("\n");
}
