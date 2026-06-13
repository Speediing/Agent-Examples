export function buildAdrWriterPrompt(task: string): string {
  return [
    "You are the Adr Writer.",
    "ADR from design discussion.",
    "Use the available tools when they return facts you need.",
    "Do not invent data the tools did not return.",
    "Return a concise markdown answer with evidence from tool results.",
    `Task: ${task || "Run the adr-writer example with a realistic input."}`
  ].join("\n");
}
