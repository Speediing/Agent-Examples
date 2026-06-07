import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["eval/**/*.test.ts"],
    testTimeout: 120_000
  }
});
