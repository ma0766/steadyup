import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { endpoints } from "../endpoints";
import { newPhone, closePhones } from "../phone";
import { tvCode, tvScreenshot, tvScreenshotBuffer, logcat, sleep, pressOk, waitScreen } from "../tv";

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

test.afterEach(closePhones);

test("S2 fake camera moves the TV stick figure; latency is logged", async ({ browser }) => {
  const code = await tvCode();
  const phone = await newPhone(browser);
  await phone.goto(`${endpoints.webUrl}/?code=${code}&delegate=cpu`);
  await expect(phone.locator("#status")).toHaveText("Connected", { timeout: 20_000 });

  // walk the remote through safety -> home -> intro -> live set, where the mirror shows
  await waitScreen("safety"); pressOk();
  await waitScreen("home"); pressOk();
  await waitScreen("intro:0"); pressOk();
  await waitScreen("live:0");

  // phone sees a body in the fake video and streams body points
  await expect(phone.locator("#seen")).toHaveText("I can see you.", { timeout: 60_000 });
  await phone.waitForFunction(() => (window.__steadyup?.sent ?? 0) >= 100, null, { timeout: 60_000 });
  await phone.screenshot({ path: "docs/screens/s2-phone-live.png" });

  // TV received poses and draws the figure; two shots a moment apart differ (figure moves)
  await expect.poll(() => logcat("SteadyUpMirror"), { timeout: 20_000 }).toContain("poses=");
  const a = tvScreenshot("s2-tv-figure");
  await sleep(700);
  const b = tvScreenshotBuffer();
  expect(a.equals(b)).toBe(false);

  // latency: TV echoes each timestamp; phone halves the round trip (clocks differ between phone and TV)
  await phone.waitForFunction(() => (window.__steadyup?.latenciesMs.length ?? 0) >= 100, null, { timeout: 60_000 });
  const lat: number[] = await phone.evaluate(() => window.__steadyup!.latenciesMs);
  const med = median(lat), p95 = [...lat].sort((x, y) => x - y)[Math.floor(lat.length * 0.95)];
  const line = `S2 latency phone->TV one-way estimate (RTT/2) over ${lat.length} frames: median ${med.toFixed(0)} ms, p95 ${p95.toFixed(0)} ms (target median < 200 ms)`;
  console.log(line);
  fs.writeFileSync("docs/LATENCY.md", `# Latency\n\n${line}\n\nMethod: the TV echoes the phone's timestamp; the phone halves the round trip. Deployed stack (CloudFront + API Gateway WebSocket + Lambda), emulator on the same Windows host as the browser.\n`);
  expect(med).toBeLessThan(200);
});
