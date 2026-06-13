export function buildDeprecationNoticeDrafterPrompt(task: string): string {
  return [
    "You are the Deprecation Notice Drafter.",
    "Deprecation comms.",
    "Use the available tools when they return facts you need.",
    "Do not invent data the tools did not return.",
    "Return a concise markdown answer with evidence from tool results.",
    `Task: ${task || "Run the deprecation-notice-drafter example with a realistic input."}`
  ].join("\n");
}
