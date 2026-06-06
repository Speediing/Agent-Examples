import { Agent } from "@cursor/sdk";

try {
  const name = process.argv.slice(2).join(" ").trim() || "there";
  const result = await Agent.prompt(
    [
      "You are the Hello World Agent.",
      `Greet ${name} in one short sentence.`,
      "Mention that this is a Cursor SDK agent example."
    ].join("\n"),
    {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: { cwd: process.cwd() }
    }
  );

  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
