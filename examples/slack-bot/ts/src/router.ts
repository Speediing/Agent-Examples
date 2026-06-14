import { AGENT_BY_SLUG } from "./catalog.js";

export type ParsedMessage =
  | { kind: "help" }
  | { kind: "invoke"; slug: string; task: string };

const HELP_TOKENS = new Set(["help", "list", "agents", "menu"]);

export function stripBotMention(text: string): string {
  return text.replace(/<@[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseSlackMessage(rawText: string): ParsedMessage {
  const text = stripBotMention(rawText);
  if (!text) {
    return { kind: "help" };
  }

  const [firstToken, ...rest] = text.split(" ");
  const normalizedFirst = firstToken.toLowerCase();

  if (HELP_TOKENS.has(normalizedFirst) && rest.length === 0) {
    return { kind: "help" };
  }

  const slug = normalizedFirst;
  if (!AGENT_BY_SLUG.has(slug)) {
    return {
      kind: "invoke",
      slug: "slack-bot",
      task: text
    };
  }

  return {
    kind: "invoke",
    slug,
    task: rest.join(" ").trim()
  };
}
