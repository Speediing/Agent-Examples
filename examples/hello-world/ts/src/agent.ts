export function buildInventoryPrompt(): string {
  return [
    "You are the inventory agent.",
    "Goal: walk the repository and write a short modernization assessment.",
    "Use built-in tools to list files, read manifests, and detect frameworks.",
    "",
    "Produce assessment.md at the repo root with:",
    "  1. Languages and file counts.",
    "  2. Runtime and framework versions from manifests (package.json, pom.xml, *.csproj, requirements.txt).",
    "  3. Top three modernization risks, one sentence each.",
    "  4. A recommended next step.",
    "",
    "Open a pull request titled 'Add codebase inventory'.",
    "Quote real file paths only. Do not invent files."
  ].join("\n");
}
