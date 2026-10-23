import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { endpoints } from "../endpoints";

const ADB = "/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe";
const adb = (...a: string[]) => execFileSync(ADB, a, { encoding: "utf8", maxBuffer: 50_000_000 }).replace(/\r/g, "");

// TV test hook: the app logs "code=NNNNNN" under tag SteadyUpPair; we read it with adb logcat (no test endpoint on the server).
async function tvCode(): Promise<string> {
  adb("logcat", "-c");
  adb("shell", "pm", "clear", "com.steadyup.tv");
  adb("shell", "am", "start", "-n", "com.steadyup.tv/.MainActivity");
  for (let i = 0; i < 40; i++) {
    const all = [...adb("logcat", "-d", "-s", "SteadyUpPair").matchAll(/code=(\d{6})/g)];
    if (all.length) {
      // let the screen settle; the app may fetch a fresh number once, so use the newest one
      await new Promise((r) => setTimeout(r, 3000));
      const last = [...adb("logcat", "-d", "-s", "SteadyUpPair").matchAll(/code=(\d{6})/g)].pop()!;
      return last[1];
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("TV never showed a number");
}
const tvScreenshot = (name: string) => {
  fs.mkdirSync("docs/screens", { recursive: true });
  fs.writeFileSync(`docs/screens/${name}.png`, execFileSync(ADB, ["exec-out", "screencap", "-p"], { maxBuffer: 50_000_000 }));
};
async function typeCode(page: Page, code: string) {
  await page.goto(endpoints.webUrl);
  await page.fill("#code", code);
  await page.click("#joinBtn");
}

test("S1 phone joins with the TV number, both show Connected; reuse is refused", async ({ browser }) => {
  const code = await tvCode();
  await new Promise((r) => setTimeout(r, 2500));
  tvScreenshot("s1-tv-code");

  const phone = await (await browser.newContext()).newPage();
  await typeCode(phone, code);
  await expect(phone.locator("#status")).toHaveText("Connected", { timeout: 20_000 });
  await phone.screenshot({ path: "docs/screens/s1-phone-connected.png" });

  await expect.poll(() => adb("logcat", "-d", "-s", "SteadyUpPair"), { timeout: 15_000 }).toContain("state=connected");
  await new Promise((r) => setTimeout(r, 1500));
  tvScreenshot("s1-tv-connected");

  const second = await (await browser.newContext()).newPage();
  await typeCode(second, code);
  await expect(second.locator("#status")).toContainText("already used", { timeout: 20_000 });
});

test("S1 a wrong number gets one friendly sentence", async ({ page }) => {
  await typeCode(page, "000000");
  await expect(page.locator("#status")).toContainText("didn't work", { timeout: 20_000 });
  await page.screenshot({ path: "docs/screens/s1-phone-wrong.png" });
});

test("S1 link with ?code= joins without typing", async ({ browser }) => {
  const code = await tvCode();
  const phone = await (await browser.newContext()).newPage();
  await phone.goto(`${endpoints.webUrl}/?code=${code}`);
  await expect(phone.locator("#status")).toHaveText("Connected", { timeout: 20_000 });
});
