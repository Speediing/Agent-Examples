export function buildSloBudgetReporterPrompt(task: string): string {
  return [
    "You are the Slo Budget Reporter.",
    "SLO reporter.",
    `Task: ${task || "Run the slo-budget-reporter example with a realistic input."}`
  ].join("\n");
}
