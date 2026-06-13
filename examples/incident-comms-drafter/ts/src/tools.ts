export function buildIncidentCommsDrafterPrompt(task: string): string {
  return [
    "You are the Incident Comms Drafter.",
    "Incident comms writer.",
    `Task: ${task || "Run the incident-comms-drafter example with a realistic input."}`
  ].join("\n");
}
