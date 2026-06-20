import { describe, expect, it } from "vitest";
import { defineEval } from "./lib/define-eval.js";
import { includes } from "./lib/expect.js";

describe("defineEval", () => {
  it("builds a runnable handle with a stable id", () => {
    const evalHandle = defineEval({
      description: "Example eval",
      agent: { send: () => ({ prompt: "" }) },
      async test() {
        // no-op for structure test
      }
    });

    expect(evalHandle.id).toBe("example-eval");
    expect(typeof evalHandle.run).toBe("function");
  });

  it("matches substrings with includes()", () => {
    const pass = includes("12").check("The total is 12");
    const fail = includes("12").check("The total is 11");

    expect(pass.pass).toBe(true);
    expect(fail.pass).toBe(false);
    expect(fail.message).toContain("12");
  });
});
