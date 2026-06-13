import fs from "node:fs/promises";
import {
  formatFindings,
  loadDefaultDiff,
  resolveDiffPath,
  validateBugbotDiff,
} from "./validate.js";

try {
  const diffPath = resolveDiffPath(process.argv[2]);
  const diff = process.argv[2]
    ? await fs.readFile(diffPath, "utf8")
    : await loadDefaultDiff();
  const findings = validateBugbotDiff(diff);

  console.log(`Validated: ${diffPath}`);
  console.log(formatFindings(findings));
  process.exit(findings.length > 0 ? 1 : 0);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
