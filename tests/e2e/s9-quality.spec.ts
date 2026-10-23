import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomBytes } from "node:crypto";
import { endpoints } from "../endpoints";
import { newPhone, closePhones } from "../phone";

test.afterEach(closePhones);

const BANNED = ["landmark", "websocket", "sync", " api ", "error code", "server", "pose "];
const PAGES = [
  { name: "phone join page", path: "/", reveal: "#live" },
  { name: "together page", path: "/together.html", reveal: "#live" },
  { name: "family page (bad link)", path: "/family.html?h=nope" },
  { name: "recorder", path: "/record.html" },
];

for (const p of PAGES) {
  test(`S9 quality: ${p.name}: axe finds nothing serious, fits 390 px, no tech words, no console errors`, async ({ browser }) => {
    const page = await newPhone(browser);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${endpoints.webUrl}${p.path}`);
    await page.waitForLoadState("networkidle");
    if (p.reveal) await page.evaluate((sel) => document.querySelector(sel)?.classList.remove("hidden"), p.reveal); // check the live view too
    const axe = await new AxeBuilder({ page }).analyze();
    const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`), "serious axe violations").toEqual([]);
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw, "sideways scroll at 390 px").toBeLessThanOrEqual(cw);
    const text = ((await page.evaluate(() => document.body.innerText)) + " ").toLowerCase();
    for (const w of BANNED) expect(text.includes(w), `tech word "${w}" visible`).toBe(false);
  });
}

test("S9 quality: a family page with real data passes axe and fits 390 px", async ({ browser }) => {
  const home = randomBytes(16).toString("hex");
  const day = new Date().toISOString().slice(0, 10);
  for (const [i, move] of ["sit_to_stand", "chair_stand_30"].entries())
    expect((await fetch(`${endpoints.apiUrl}/sets`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ home, session: `q${i}`, idx: 0, move, target: move === "chair_stand_30" ? 30 : 8, done: move === "chair_stand_30" ? 11 : 8, cues: 0, day, ts: Date.now() + i }) })).ok).toBe(true);
  const page = await newPhone(browser);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${endpoints.webUrl}/family.html?h=${home}`);
  await expect(page.locator("#chair-now")).toHaveText("11 stands in 30 seconds", { timeout: 15_000 });
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
  await page.screenshot({ path: "docs/screens/s9-family-data.png" });
});
