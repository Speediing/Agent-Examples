type ToolResult = {
  tool: string;
  result: string;
};

type Tool = {
  name: string;
  description: string;
  canHandle: (prompt: string) => boolean;
  run: (prompt: string) => ToolResult;
};

const addTool: Tool = {
  name: "add",
  description: "Adds every number found in the prompt.",
  canHandle: (prompt) => /\b(add|sum|plus)\b/i.test(prompt),
  run: (prompt) => {
    const numbers = extractNumbers(prompt);
    const total = numbers.reduce((sum, number) => sum + number, 0);

    return {
      tool: "add",
      result: `${numbers.join(" + ")} = ${total}`
    };
  }
};

const wordCountTool: Tool = {
  name: "word_count",
  description: "Counts words in the prompt.",
  canHandle: (prompt) => /\b(count|words?)\b/i.test(prompt),
  run: (prompt) => {
    const words = prompt.trim().split(/\s+/).filter(Boolean);

    return {
      tool: "word_count",
      result: `${words.length} words`
    };
  }
};

const tools: Tool[] = [addTool, wordCountTool];

function runAgent(prompt: string): string {
  const selectedTool = tools.find((tool) => tool.canHandle(prompt));

  if (!selectedTool) {
    const availableTools = tools
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join("; ");

    return `No tool selected. Available tools: ${availableTools}`;
  }

  const toolResult = selectedTool.run(prompt);
  return `Used ${toolResult.tool}: ${toolResult.result}`;
}

function extractNumbers(input: string): number[] {
  const matches = input.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return matches.map(Number);
}

const prompt = process.argv.slice(2).join(" ");
console.log(runAgent(prompt));
