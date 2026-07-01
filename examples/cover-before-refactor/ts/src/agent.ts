export function buildCoveragePrompt(target: string): string {
  return [
    "You are the characterization-test agent.",
    `Goal: cover ${target} with tests so a future refactor cannot regress behaviour.`,
    "",
    "Steps:",
    `  1. Read ${target}.`,
    "  2. Run the existing tests with coverage and read the per-file report.",
    `  3. For each uncovered branch in ${target}, add a test under tests/ that pins current behaviour.`,
    `  4. Rerun tests with coverage. Stop when ${target} is at >= 80% line coverage.`,
    "",
    `Never modify ${target}. Only add files under tests/.`,
    `Open a PR titled 'Cover ${target}' that quotes the before / after coverage numbers.`
  ].join("\n");
}
