export function buildWavesPrompt(): string {
  return [
    "You are the wave-planning agent.",
    "Goal: read the service inventory in this repo and produce a modernization wave plan.",
    "",
    "Steps:",
    "  1. Read inventory.json. Expect entries with { name, dependsOn, criticality }.",
    "  2. Write scripts/plan-waves.ts that topologically orders the services:",
    "       - A service never moves before its dependencies.",
    "       - Within a wave, sort by criticality ascending (safer services first).",
    "       - Each wave holds at most six services. Throw on cycles.",
    "  3. Run the script and write waves.md with the wave order.",
    "  4. Add one risk per wave: dependencies that span teams, services with no tests, services that touch payments.",
    "",
    "Open a PR titled 'Add modernization wave plan' that quotes the full wave list.",
    "Keep the planning rules in scripts/plan-waves.ts. Do not paraphrase them in prose."
  ].join("\n");
}
