export type ActionableMigrationResult = {
  status: string;
  example: string;
  message: string;
};

export function buildMigrationPrompt(
  actionableResults: ActionableMigrationResult[]
): string {
  return [
    "You are the Migration Agent for this examples repository.",
    "TypeScript examples are canonical. Python ports must match their behavior.",
    "For each stale or missing Python port below, inspect the TypeScript implementation and update or create the matching Python port.",
    "Use the Python Cursor SDK in Python ports, mirroring the TypeScript Cursor SDK pattern.",
    "After editing, run the relevant Python file and report what changed.",
    JSON.stringify(actionableResults, null, 2)
  ].join("\n\n");
}
