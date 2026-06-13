export function buildReleaseNotesDrafterPrompt(task: string): string {
  return [
    "You are the Release Notes Drafter.",
    "Release notes writer.",
    `Task: ${task || "Run the release-notes-drafter example with a realistic input."}`
  ].join("\n");
}
