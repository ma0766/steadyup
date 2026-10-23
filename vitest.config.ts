import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["web/src/**/*.test.ts", "server/src/**/*.test.ts", "tests/unit/**/*.test.ts"], environment: "node" },
});
