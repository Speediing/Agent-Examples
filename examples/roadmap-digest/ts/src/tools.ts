export function buildRoadmapDigestPrompt(task: string): string {
  return [
    "You are the Roadmap Digest.",
    "Scheduled digest writer.",
    `Task: ${task || "Run the roadmap-digest example with a realistic input."}`
  ].join("\n");
}
