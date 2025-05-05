import { configDefaults, defineConfig as defineVitestConfig } from "vitest/config";

// We exclude the backend directory because we use Bun (not Vitest) to run those tests
const TEST_EXCLUDES = [...configDefaults.exclude, "build.ts"];
const COVERAGE_EXCLUDE = [...TEST_EXCLUDES, "**/*.test.{ts,tsx}"];

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "node",
    exclude: TEST_EXCLUDES,
    coverage: {
      all: true,
      provider: "istanbul",
      exclude: COVERAGE_EXCLUDE,
      thresholds: {
        "100": true,
      },
    },
  },
});

export default vitestConfig;
