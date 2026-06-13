export function buildAdrWriterPrompt(task: string): string {
  return [
    "You are the Adr Writer.",
    "ADR from design discussion.",
    `Task: ${task || "Run the adr-writer example with a realistic input."}`
  ].join("\n");
}
