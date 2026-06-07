import { describe, expect, it } from "vitest";
import { classifyPortStatus } from "../examples/migration-agent/ts/src/classifier.js";

describe("migration port classifier", () => {
  it("returns missing when the Python port does not exist", () => {
    expect(
      classifyPortStatus({
        pythonExists: false,
        latestTsMtime: 100,
        pythonMtime: 0,
        writeStubs: false
      })
    ).toBe("missing");
  });

  it("returns created when stubs are enabled for a missing port", () => {
    expect(
      classifyPortStatus({
        pythonExists: false,
        latestTsMtime: 100,
        pythonMtime: 0,
        writeStubs: true
      })
    ).toBe("created");
  });

  it("returns stale when TypeScript is newer than Python", () => {
    expect(
      classifyPortStatus({
        pythonExists: true,
        latestTsMtime: 200,
        pythonMtime: 100,
        writeStubs: false
      })
    ).toBe("stale");
  });

  it("returns ok when Python is current", () => {
    expect(
      classifyPortStatus({
        pythonExists: true,
        latestTsMtime: 100,
        pythonMtime: 200,
        writeStubs: false
      })
    ).toBe("ok");
  });
});
