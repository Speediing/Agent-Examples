#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const examples = [
  "inherited-analysis-explainer",
  "sample-id-reconciler",
  "notebook-pipeline-drafter",
  "omics-qc-gate",
  "analysis-plan-drafter",
  "dataset-freshness-monitor",
];

const tsconfig = `{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
`;

for (const slug of examples) {
  const base = path.join(root, "examples", slug);
  const tsDir = path.join(base, "ts", "src");
  const pyDir = path.join(base, "python");
  fs.mkdirSync(tsDir, { recursive: true });
  fs.mkdirSync(pyDir, { recursive: true });
  fs.mkdirSync(path.join(base, "fixtures"), { recursive: true });

  const pkgName = slug.replace(/-/g, "-");
  fs.writeFileSync(
    path.join(base, "ts", "package.json"),
    JSON.stringify(
      {
        name: `@cursor-examples/${slug}-ts`,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          build: "tsc -p tsconfig.json",
          start: "node dist/index.js",
        },
        cursorExample: { pythonPort: "../python/main.py" },
        devDependencies: { typescript: "^5.9.3" },
        dependencies: { "@cursor/sdk": "^1.0.18" },
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(path.join(base, "ts", "tsconfig.json"), tsconfig);
}

console.log(`Scaffolded ${examples.length} LifeSci examples.`);
