type AgentInput = {
  name: string;
};

type AgentResponse = {
  message: string;
};

function runAgent(input: AgentInput): AgentResponse {
  const name = input.name.trim() || "there";

  return {
    message: `Hello, ${name}. This is your first Cursor SDK agent example.`
  };
}

const name = process.argv.slice(2).join(" ");
const response = runAgent({ name });

console.log(response.message);
