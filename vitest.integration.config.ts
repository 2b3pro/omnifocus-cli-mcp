import { defineConfig } from "vitest/config";

// Integration config: runs the live OmniFocus tests (gated by OMNIFOCUS_LIVE=1
// via describe.skipIf). Unlike the default config, it does NOT exclude
// live-omnifocus.test.ts. Generous timeouts for real Apple Events round-trips.
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
