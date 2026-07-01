import { buildInventoryPrompt } from "./agent.js";
import {
  printCloudResult,
  submitCloudAgent,
} from "@cursor-examples/modernization-core";

try {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: npm run inventory:ts -- <owner>/<repo>");
  }

  const result = await submitCloudAgent({
    target,
    prompt: buildInventoryPrompt(),
  });
  printCloudResult(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
