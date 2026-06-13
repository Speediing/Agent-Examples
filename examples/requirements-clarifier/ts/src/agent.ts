export function buildRequirementsClarifierPrompt(threadText: string): string {
  const report = threadText.trim() || "Example requirements-clarifier thread input.";
  return [
    "You are the Requirements Clarifier.",
    "Chat clarifier.",
    "Do not claim you created a ticket or opened a pull request.",
    `Thread:\n${report}`
  ].join("\n");
}
