import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/types.ts"],
      // hash.ts and merkle.ts are the cryptographic core every proof depends on forever
      // (prd.md Section 15 calls this a release blocker, not a suggestion).
      thresholds: {
        "src/hash.ts": { branches: 100, functions: 100, lines: 100, statements: 100 },
        "src/merkle.ts": { branches: 100, functions: 100, lines: 100, statements: 100 },
      },
    },
  },
});
