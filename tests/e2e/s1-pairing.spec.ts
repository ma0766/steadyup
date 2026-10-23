import { test, expect, type Page } from "@playwright/test";
import { endpoints } from "../endpoints";
import { newPhone, closePhones } from "../phone";
import { adb, tvCode, tvScreenshot, sleep } from "../tv";

async function typeCode(page: Page, code: string) {
  await page.goto(endpoints.webUrl);
  await page.fill("#code", code);
  await page.click("#joinBtn");
}

test.afterEach(closePhones);

test("S1 phone joins with the TV number, both show Connected; reuse is refused", async ({ browser }) => {
  const code = await tvCode();
  tvScreenshot("s1-tv-code");

  const phone = await newPhone(browser);
  await typeCode(phone, code);
  await expect(phone.locator("#status")).toHaveText("Connected", { timeout: 20_000 });
  await phone.screenshot({ path: "docs/screens/s1-phone-connected.png" });

  await expect.poll(() => adb("logcat", "-d", "-s", "SteadyUpPair"), { timeout: 15_000 }).toContain("state=connected");
  await sleep(1500);
  tvScreenshot("s1-tv-connected");

  const second = await newPhone(browser);
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
  const phone = await newPhone(browser);
  await phone.goto(`${endpoints.webUrl}/?code=${code}`);
  await expect(phone.locator("#status")).toHaveText("Connected", { timeout: 20_000 });
});
