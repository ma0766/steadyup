import { defineConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Fake camera: Chromium streams a looping y4m file as the webcam (make it with: node scripts/make-fixtures.mjs).
const y4m = path.resolve("fixtures/squat.y4m");
const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];
if (fs.existsSync(y4m)) args.push(`--use-file-for-fake-video-capture=${y4m}`);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/pw.json" }]],
  use: { launchOptions: { args } },
});
