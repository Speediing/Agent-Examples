import type { SDKJsonValue } from "@cursor/sdk";

export function readNumberArray(value: SDKJsonValue | undefined): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
}

export function addNumbers(args: { numbers?: SDKJsonValue }): {
  expression: string;
  total: number;
} {
  const numbers = readNumberArray(args.numbers);
  const total = numbers.reduce((sum, number) => sum + number, 0);

  return {
    expression: numbers.join(" + "),
    total
  };
}

export function countWords(args: { text?: SDKJsonValue }): { count: number } {
  const text = typeof args.text === "string" ? args.text : "";
  const count = text.trim().split(/\s+/).filter(Boolean).length;

  return { count };
}

export function buildToolCallingPrompt(prompt: string): string {
  return [
    "You are the Tool Calling Agent.",
    "Use the available custom tools when they are relevant.",
    "Return a concise final answer that includes the tool result.",
    `User request: ${prompt || "count the words in this default request"}`
  ].join("\n");
}

export function createToolCallingCustomTools() {
  return {
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
      execute: (args: { numbers?: SDKJsonValue }) => addNumbers(args)
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
      execute: (args: { text?: SDKJsonValue }) => countWords(args)
    }
  };
}
