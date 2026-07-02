import { describe, expect, it } from "vitest";
import { buildInventoryPrompt } from "../../examples/hello-world/ts/src/agent.js";

describe("inventory agent prompt", () => {
  it("names assessment deliverables for cloud inventory runs", () => {
    const prompt = buildInventoryPrompt();
    expect(prompt).toContain("inventory agent");
    expect(prompt).toContain("assessment.md");
    expect(prompt).toContain("coupling-map.md");
    expect(prompt).toContain("Add codebase inventory");
  });
});
