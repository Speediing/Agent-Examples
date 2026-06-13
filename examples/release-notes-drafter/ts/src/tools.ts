export function buildReleaseNotesDrafterPrompt(task: string): string {
  return [
    "You are the Release Notes Drafter.",
    "Release notes writer.",
    "Use the available tools when they return facts you need.",
    "Do not invent data the tools did not return.",
    "Return a concise markdown answer with evidence from tool results.",
    `Task: ${task || "Run the release-notes-drafter example with a realistic input."}`
  ].join("\n");
}
