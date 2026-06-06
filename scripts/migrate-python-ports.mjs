import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = path.join(rootDir, "examples");
const shouldWriteStubs = process.argv.includes("--write-stubs");

const examples = await listExampleDirs();
const results = [];

for (const exampleDir of examples) {
  const tsDir = path.join(exampleDir, "ts");
  const packageJsonPath = path.join(tsDir, "package.json");

  if (!(await fileExists(packageJsonPath))) {
    results.push({
      status: "error",
      example: path.basename(exampleDir),
      message: "missing ts/package.json"
    });
    continue;
  }

  let packageJson;
  try {
    packageJson = await readJson(packageJsonPath);
  } catch {
    results.push({
      status: "error",
      example: path.basename(exampleDir),
      message: "invalid ts/package.json"
    });
    continue;
  }

  const pythonPort = packageJson.cursorExample?.pythonPort;

  if (!pythonPort) {
    results.push({
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

    results.push({
      status: shouldWriteStubs ? "created" : "missing",
      example: path.basename(exampleDir),
      message: relativePath(pythonPortPath)
    });
    continue;
  }

  const pythonMtime = (await fs.stat(pythonPortPath)).mtimeMs;
  const isStale = latestTsMtime > pythonMtime;

  results.push({
    status: isStale ? "stale" : "ok",
    example: path.basename(exampleDir),
    message: isStale
      ? `${relativePath(pythonPortPath)} is older than the TypeScript source`
      : `${relativePath(pythonPortPath)} is current`
  });
}

printResults(results);

const hasFailures = results.some((result) =>
  ["error", "missing", "stale"].includes(result.status)
);

if (hasFailures) {
  process.exitCode = 1;
}

async function listExampleDirs() {
  const entries = await fs.readdir(examplesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(examplesDir, entry.name))
    .sort();
}

async function listFiles(dir, extensions) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

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

async function latestMtime(files) {
  const mtimes = await Promise.all(
    files.map(async (file) => (await fs.stat(file)).mtimeMs)
  );

  return Math.max(...mtimes);
}

async function readJson(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writePythonStub({ exampleName, targetPath }) {
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

function printResults(results) {
  for (const result of results) {
    const label = result.status.toUpperCase().padEnd(7);
    console.log(`${label} ${result.example}: ${result.message}`);
  }
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath);
}
