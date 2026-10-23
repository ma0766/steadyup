import { test, expect } from "@playwright/test";
import { endpoints } from "../endpoints";

test("S3 recorder page saves a landmark stream (body points, not video) as JSON", async ({ page }) => {
  await page.goto(`${endpoints.webUrl}/record.html?delegate=cpu`);
  await page.click("#rec");
  await expect(page.locator("#info")).toContainText("Recording", { timeout: 60_000 });
  await page.waitForTimeout(3000);
  await page.click("#stop");
  const href = await page.getAttribute("#download", "href");
  expect(href).toBeTruthy();
  const json = await page.evaluate(async (h) => (await fetch(h!)).json(), href);
  expect(json.frames.length).toBeGreaterThan(10);
  const withBody = json.frames.filter((f: any) => f.lm);
  expect(withBody.length).toBeGreaterThan(5);
  expect(withBody[0].lm).toHaveLength(33);
  expect(Object.keys(withBody[0].lm[0]).sort()).toEqual(["visibility", "x", "y"]); // no pixels anywhere in the file
});
