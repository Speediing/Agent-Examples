export function buildRoadmapDigestPrompt(task: string): string {
  return [
    "You are the Roadmap Digest.",
    "Scheduled digest writer.",
    "Use the available tools when they return facts you need.",
    "Do not invent data the tools did not return.",
    "Return a concise markdown answer with evidence from tool results.",
    `Task: ${task || "Run the roadmap-digest example with a realistic input."}`
  ].join("\n");
}
