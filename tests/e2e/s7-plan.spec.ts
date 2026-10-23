import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { endpoints } from "../endpoints";

// Live: real Bedrock call through the deployed API (the only AI call in the product; never in the live loop).
test("S7 a refreshed plan stays within caps and shows on the family page", async ({ page }) => {
  test.setTimeout(120_000);
  const home = randomBytes(16).toString("hex");
  const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  for (let i = 0; i < 7; i++) {
    const r = await fetch(`${endpoints.apiUrl}/sets`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ home, session: `e2e${i}`, idx: 0, move: "sit_to_stand", target: 8, done: 8, cues: 0, day: day(i), ts: Date.now() - i * 86_400_000 }) });
    expect(r.ok).toBe(true);
  }
  const plan = await (await fetch(`${endpoints.apiUrl}/plan/refresh?home=${home}`, { method: "POST" })).json();
  expect(plan.source).toBe("model");
  expect(plan.targets.sit_to_stand).toBeGreaterThanOrEqual(6);
  expect(plan.targets.sit_to_stand).toBeLessThanOrEqual(10);
  expect(plan.targets.tandem_hold).toBeLessThanOrEqual(25);
  for (const c of plan.changes) expect(c.sentence.length).toBeGreaterThan(0);

  const stored = await (await fetch(`${endpoints.apiUrl}/plan?home=${home}`)).json();
  expect(stored.targets).toEqual(plan.targets);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${endpoints.webUrl}/family.html?h=${home}`);
  await expect(page.locator("#sessions")).toContainText("session", { timeout: 20_000 });
  if (plan.changes.some((c: any) => c.to !== c.from)) {
    await expect(page.locator("#plan-card")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#plan")).toContainText("Sit to stand");
  }
  await page.screenshot({ path: "docs/screens/s7-family-plan.png" });
});
