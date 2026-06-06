import { Agent } from "@cursor/sdk";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type MigrationStatus = "ok" | "stale" | "missing" | "created" | "error";

type MigrationResult = {
  status: MigrationStatus;
  example: string;
  message: string;
};

type PackageJson = {
  cursorExample?: {
    pythonPort?: string;
  };
};

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);
const examplesDir = path.join(rootDir, "examples");
const shouldWriteStubs = process.argv.includes("--write-stubs");
const shouldUseCursorSdk = process.argv.includes("--use-cursor-sdk");

const results = await auditPythonPorts();
printResults(results);

if (shouldUseCursorSdk) {
  await runCursorSdkMigration(results);
}

if (hasFailures(results)) {
  process.exitCode = 1;
}

async function auditPythonPorts(): Promise<MigrationResult[]> {
  const examples = await listExampleDirs();
  const auditResults: MigrationResult[] = [];

  for (const exampleDir of examples) {
    const tsDir = path.join(exampleDir, "ts");
    const packageJsonPath = path.join(tsDir, "package.json");

    if (!(await fileExists(packageJsonPath))) {
      auditResults.push({
        status: "error",
        example: path.basename(exampleDir),
        message: "missing ts/package.json"
      });
      continue;
    }

    let packageJson: PackageJson;
    try {
      packageJson = await readJson<PackageJson>(packageJsonPath);
    } catch {
      auditResults.push({
        status: "error",
        example: path.basename(exampleDir),
        message: "invalid ts/package.json"
      });
      continue;
    }

    const pythonPort = packageJson.cursorExample?.pythonPort;

    if (!pythonPort) {
      auditResults.push({
        status: "error",
        example: path.basename(exampleDir),
        message: "missing cursorExample.pythonPort in ts/package.json"
      });
      continue;
    }

    const pythonPortPath = path.resolve(tsDir, pythonPort);
    const tsFiles = await listFiles(tsDir, [".ts", ".json"]);
    const latestTsMtime = await latestMtime(tsFiles);
    const pythonExists = await fileExists(pythonPortPath);

    if (!pythonExists) {
      if (shouldWriteStubs) {
        await writePythonStub({
          exampleName: path.basename(exampleDir),
          targetPath: pythonPortPath
        });
      }

      auditResults.push({
        status: shouldWriteStubs ? "created" : "missing",
        example: path.basename(exampleDir),
        message: relativePath(pythonPortPath)
      });
      continue;
    }

    const pythonMtime = (await fs.stat(pythonPortPath)).mtimeMs;
    const isStale = latestTsMtime > pythonMtime;

    auditResults.push({
      status: isStale ? "stale" : "ok",
      example: path.basename(exampleDir),
      message: isStale
        ? `${relativePath(pythonPortPath)} is older than the TypeScript source`
        : `${relativePath(pythonPortPath)} is current`
    });
  }

  return auditResults;
}

async function runCursorSdkMigration(resultsToReview: MigrationResult[]) {
  const actionableResults = resultsToReview.filter((result) =>
    ["missing", "stale"].includes(result.status)
  );

  if (actionableResults.length === 0) {
    console.log("SKIPPED Cursor SDK migration: all Python ports are current.");
    return;
  }

  if (!process.env.CURSOR_API_KEY) {
    console.log(
      "SKIPPED Cursor SDK migration: set CURSOR_API_KEY to let the Migration Agent update Python ports."
    );
    return;
  }

  if (!process.env.CURSOR_MODEL) {
    console.log(
      "SKIPPED Cursor SDK migration: set CURSOR_MODEL to choose the SDK model."
    );
    return;
  }

  const prompt = [
    "You are the Migration Agent for this examples repository.",
    "TypeScript examples are canonical. Python ports must match their behavior.",
    "For each stale or missing Python port below, inspect the TypeScript implementation and update or create the matching Python port.",
    "Use the Python Cursor SDK in Python ports, mirroring the TypeScript Cursor SDK pattern.",
    "After editing, run the relevant Python file and report what changed.",
    JSON.stringify(actionableResults, null, 2)
  ].join("\n\n");

  const response = await Agent.prompt(prompt, {
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: process.env.CURSOR_MODEL },
    local: { cwd: rootDir }
  });

  console.log("\nCursor SDK migration result:");
  console.log(String(response));
}

async function listExampleDirs(): Promise<string[]> {
  const entries = await fs.readdir(examplesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(examplesDir, entry.name))
    .sort();
}

async function listFiles(dir: string, extensions: string[]): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath, extensions)));
      continue;
    }

    if (extensions.includes(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

async function latestMtime(files: string[]): Promise<number> {
  if (files.length === 0) {
    return 0;
  }

  const mtimes = await Promise.all(
    files.map(async (file) => (await fs.stat(file)).mtimeMs)
  );

  return Math.max(...mtimes);
}

async function readJson<T>(filePath: string): Promise<T> {
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writePythonStub({
  exampleName,
  targetPath
}: {
  exampleName: string;
  targetPath: string;
}) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(
    targetPath,
    [
      '"""Python port placeholder.',
      "",
      `Port the canonical TypeScript implementation from examples/${exampleName}/ts.`,
      '"""',
      "",
      "",
      "def main() -> None:",
      '    raise NotImplementedError("Port the TypeScript example first.")',
      "",
      "",
      'if __name__ == "__main__":',
      "    main()",
      ""
    ].join("\n")
  );
}

function printResults(resultsToPrint: MigrationResult[]) {
  for (const result of resultsToPrint) {
    const label = result.status.toUpperCase().padEnd(7);
    console.log(`${label} ${result.example}: ${result.message}`);
  }
}

function hasFailures(resultsToCheck: MigrationResult[]): boolean {
  return resultsToCheck.some((result) =>
    ["error", "missing", "stale"].includes(result.status)
  );
}

function relativePath(filePath: string): string {
  return path.relative(rootDir, filePath);
}
