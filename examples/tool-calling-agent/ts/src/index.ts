import { Agent, type SDKJsonValue } from "@cursor/sdk";

try {
  const prompt = process.argv.slice(2).join(" ").trim();
  const result = await Agent.prompt(
    [
      "You are the Tool Calling Agent.",
      "Use the available custom tools when they are relevant.",
      "Return a concise final answer that includes the tool result.",
      `User request: ${prompt || "count the words in this default request"}`
    ].join("\n"),
    {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: {
        cwd: process.cwd(),
        customTools: {
          add: {
            description: "Adds a list of numbers.",
            inputSchema: {
              type: "object",
              properties: {
                numbers: {
                  type: "array",
                  items: { type: "number" }
                }
              },
              required: ["numbers"]
            },
            execute: (args) => {
              const numbers = readNumberArray(args.numbers);
              const total = numbers.reduce((sum, number) => sum + number, 0);

              return {
                expression: numbers.join(" + "),
                total
              };
            }
          },
          word_count: {
            description: "Counts words in a text string.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string" }
              },
              required: ["text"]
            },
            execute: (args) => {
              const text = typeof args.text === "string" ? args.text : "";
              const count = text.trim().split(/\s+/).filter(Boolean).length;

              return { count };
            }
          }
        }
      }
    }
  );

  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function readNumberArray(value: SDKJsonValue | undefined): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
