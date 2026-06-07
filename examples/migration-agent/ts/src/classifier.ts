export type PortAuditStatus = "ok" | "stale" | "missing" | "created";

export type ClassifyPortInput = {
  pythonExists: boolean;
  latestTsMtime: number;
  pythonMtime: number;
  writeStubs: boolean;
};

export function classifyPortStatus(input: ClassifyPortInput): PortAuditStatus {
  const { pythonExists, latestTsMtime, pythonMtime, writeStubs } = input;

  if (!pythonExists) {
    return writeStubs ? "created" : "missing";
  }

  return latestTsMtime > pythonMtime ? "stale" : "ok";
}

export const SKIP_AUDIT_DIRS = new Set(["node_modules", "dist"]);

export function shouldSkipAuditDir(name: string): boolean {
  return SKIP_AUDIT_DIRS.has(name);
}
