export function buildOnCallDigestPrompt(task: string): string {
  return [
    "You are the On Call Digest.",
    "On-call digest.",
    `Task: ${task || "Run the on-call-digest example with a realistic input."}`
  ].join("\n");
}
