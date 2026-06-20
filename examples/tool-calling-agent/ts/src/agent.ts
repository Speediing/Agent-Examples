import type { SDKCustomTool } from "@cursor/sdk";
import {
  buildToolCallingPrompt,
  createToolCallingCustomTools
} from "./tools.js";

export type AgentRunInput = {
  prompt: string;
  customTools?: Record<string, SDKCustomTool>;
  cwd?: string;
};

export type ToolCallingAgent = {
  send: (userMessage: string) => AgentRunInput;
};

export function createToolCallingAgent(options?: { cwd?: string }): ToolCallingAgent {
  return {
    send(userMessage: string): AgentRunInput {
      return {
        prompt: buildToolCallingPrompt(userMessage),
        customTools: createToolCallingCustomTools(),
        cwd: options?.cwd
      };
    }
  };
}

export const toolCallingAgent = createToolCallingAgent();
