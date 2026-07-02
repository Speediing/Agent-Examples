export function buildInventoryPrompt(): string {
  return [
    "You are the inventory agent.",
    "Goal: map the legacy codebase so architects can plan a migration without manual archaeology.",
    "Use built-in tools to list files, read manifests, trace imports/COPY/includes, and detect frameworks.",
    "",
    "Produce assessment.md at the repo root with:",
    "  1. Languages and file counts (top five extensions with approximate LOC).",
    "  2. Runtime and framework versions from manifests (package.json, pom.xml, *.csproj, requirements.txt).",
    "  3. Dependency hotspots: modules with the highest fan-in or COPY/include chains longer than three hops.",
    "  4. Coupling map: list isolated candidates for a first pilot vs tightly coupled clusters to defer.",
    "  5. Duplicated logic: copy-pasted blocks or parallel implementations that should merge before porting.",
    "  6. Top three modernization risks, one sentence each, tied to a real file path.",
    "  7. Recommended first pilot: one bounded program or service with clear inputs/outputs.",
    "",
    "Also write coupling-map.md with a table: module, inbound deps, outbound deps, pilot_ready (yes/no), notes.",
    "Open a pull request titled 'Add codebase inventory'.",
    "Quote real file paths only. Do not invent files."
  ].join("\n");
}
