import { buildCoveragePrompt } from "./agent.js";
import {
  printCloudResult,
  submitCloudAgent,
} from "@cursor-examples/modernization-core";

try {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: npm run cover:ts -- <owner>/<repo> <file>");
  }
  const file = process.argv[3];
  if (!file) {
    throw new Error("Usage: npm run cover:ts -- <owner>/<repo> <file>");
  }

  const result = await submitCloudAgent({
    target,
    prompt: buildCoveragePrompt(file),
  });
  printCloudResult(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
