import { test, expect } from "@playwright/test";
import WebSocket from "ws";
import { endpoints } from "../endpoints";

test("S0 deployed phone page loads over HTTPS", async ({ page }) => {
  expect(endpoints.webUrl.startsWith("https://")).toBe(true);
  await page.goto(endpoints.webUrl);
  await expect(page.locator("h1")).toHaveText("SteadyUp");
  await expect(page.locator("#status")).toHaveText("Ready.");
  await page.screenshot({ path: "docs/screens/s0-phone.png" });
});

test("S0 deployed WebSocket echoes", async () => {
  const ws = new WebSocket(endpoints.wsUrl);
  const got = await new Promise<string>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("no echo in 15s")), 15_000);
    ws.on("open", () => ws.send("ping-s0"));
    ws.on("message", (m) => { clearTimeout(t); resolve(m.toString()); });
    ws.on("error", reject);
  });
  ws.close();
  expect(got).toBe("ping-s0");
});
