export function buildAlertTriageBotPrompt(threadText: string): string {
  const report = threadText.trim() || "Example alert-triage-bot thread input.";
  return [
    "You are the Alert Triage Bot.",
    "Alert triage chat.",
    "Do not claim you created a ticket or opened a pull request.",
    `Thread:\n${report}`
  ].join("\n");
}
