import fs from "node:fs";
import path from "node:path";
// Playwright runs from repo root; config/endpoints.json is committed (written by npm run deploy).
export const endpoints: { wsUrl: string; webUrl: string } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "config/endpoints.json"), "utf8"),
);
