export function buildRiskScorePrompt(): string {
  return [
    "You are the risk-scoring agent.",
    "Goal: write a deterministic risk score for the repo and commit it.",
    "",
    "Steps:",
    "  1. Write scripts/score-risk.ts that exports scoreRisk(inputs).",
    "  2. Manifest scoring rules:",
    "      - .NET Framework manifests: +4 each",
    "      - Java 8 (1.8) manifests:  +3 each",
    "      - Node engines < 18:        +2 each",
    "      - 'unknown' version fields: +2 each",
    "  3. Coupling rules (read coupling-map.md if present, else infer from imports/COPY):",
    "      - fan-in >= 8:              +3",
    "      - fan-out >= 12:            +2",
    "      - cyclic dependency cluster:+5",
    "  4. Test and observability rules:",
    "      - no tests/ directory:      +3",
    "      - coverage config missing:  +1",
    "     Severity: high (>=8), medium (2-7), low (<2).",
    "  5. Run the script against the actual repo. Write score, severity, blockers, and pilot candidates to risk.md.",
    "",
    "Open a PR titled 'Add modernization risk score'.",
    "The scoring rules belong in scripts/score-risk.ts. Do not put them in prose."
  ].join("\n");
}
