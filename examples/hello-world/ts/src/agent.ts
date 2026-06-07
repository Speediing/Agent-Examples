export function buildHelloWorldPrompt(name: string): string {
  const recipient = name.trim() || "there";

  return [
    "You are the Hello World Agent.",
    `Greet ${recipient} in one short sentence.`,
    "Mention that this is a Cursor SDK agent example."
  ].join("\n");
}
