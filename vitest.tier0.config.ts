import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["eval/**/*.test.ts"],
    exclude: [
      "eval/tier1/**",
      "eval/tier2/**",
      "eval/parity/ts-python-trace.test.ts"
    ],
    testTimeout: 120_000
  }
});
