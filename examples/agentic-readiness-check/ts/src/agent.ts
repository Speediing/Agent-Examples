export function buildAraPrompt(): string {
  return [
    "You are the agentic readiness analysis (ARA) agent.",
    "Goal: report which HTTP endpoints in this repo are safe for an AI agent to call autonomously.",
    "",
    "Steps:",
    "  1. Find every HTTP route handler in the repo.",
    "  2. For each route, score these five signals (yes / no):",
    "       idempotency      - header or argument named Idempotency-Key",
    "       rate_limit       - middleware or response header for rate limiting",
    "       auth             - explicit auth check on the route",
    "       structured_errors- structured error response, not free-form text",
    "       observability    - log or trace span on the handler",
    "  3. Score = 2 * (signals found). Blockers = missing idempotency, rate_limit, auth, or structured_errors.",
    "  4. Group endpoints:",
    "       ready      - score 10 with zero blockers",
    "       needs_work - score 4-8 or missing one non-auth blocker",
    "       blocked    - missing auth or score < 4",
    "  An endpoint with score >= 8 but missing auth is blocked, never ready.",
    "",
    "Write the result to readiness.md and open a PR titled 'Add agentic readiness report'.",
    "Quote every endpoint with its source file and line. Do not invent routes."
  ].join("\n");
}
