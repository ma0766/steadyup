import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/pw.json" }]],
  use: { launchOptions: { args: ["--use-fake-ui-for-media-stream"] } },
});
