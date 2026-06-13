export function buildIncidentCommsDrafterPrompt(task: string): string {
  return [
    "You are the Incident Comms Drafter.",
    "Incident comms writer.",
    "Use the available tools when they return facts you need.",
    "Do not invent data the tools did not return.",
    "Return a concise markdown answer with evidence from tool results.",
    `Task: ${task || "Run the incident-comms-drafter example with a realistic input."}`
  ].join("\n");
}
