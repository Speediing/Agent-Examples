import { buildNetUpgradePrompt } from "./agent.js";
import {
  printCloudResult,
  submitCloudAgent,
} from "@cursor-examples/modernization-core";

try {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: npm run transform:net:ts -- <owner>/<repo>");
  }

  const result = await submitCloudAgent({
    target,
    prompt: buildNetUpgradePrompt(),
  });
  printCloudResult(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
