export function buildDeprecationNoticeDrafterPrompt(task: string): string {
  return [
    "You are the Deprecation Notice Drafter.",
    "Deprecation comms.",
    `Task: ${task || "Run the deprecation-notice-drafter example with a realistic input."}`
  ].join("\n");
}
