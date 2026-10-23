import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { endpoints } from "../endpoints";
import { ScriptedPhone } from "../scriptedPhone";
import { tvCode, tvScreenshot, pressOk, pressKey, waitScreen, logcat, sleep } from "../tv";
import { newPhone, closePhones } from "../phone";

test.afterEach(closePhones);

const roomCode = async () => {
  for (let i = 0; i < 40; i++) { const m = [...logcat("SteadyUpFlow").matchAll(/room=(\d{6})/g)].pop(); if (m) return m[1]; await sleep(500); }
  throw new Error("TV never opened a room");
};
// Home -> arrow right to "Move together" -> OK
async function openTogether() {
  await waitScreen("safety"); pressOk();
  await waitScreen("home"); await sleep(800);
  pressKey("KEYCODE_DPAD_RIGHT"); await sleep(500); pressOk(); // 2x2 grid: Move together is right of Start
  await waitScreen("together");
}

test("S8 two scripted people: both figures, separate reps, Together: 6", async () => {
  test.setTimeout(3 * 60_000);
  const home = randomBytes(16).toString("hex");
  const code = await tvCode(["--es", "plan", "sit_to_stand:3", "--ei", "restSec", "1", "--es", "home", home]);
  const mom = new ScriptedPhone(endpoints.wsUrl), ana = new ScriptedPhone(endpoints.wsUrl);
  ana.kneesCaveFirstSet = false;
  try {
    await mom.join(code);
    await openTogether();
    await ana.joinRoom(await roomCode(), "Ana");
    await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 15_000 }).toContain("guest=Ana");
    await sleep(1200); tvScreenshot("s8-tv-room");
    pressOk(); // Start together
    await waitScreen("intro:0"); pressOk();
    await waitScreen("live:0");
    await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 30_000 }).toContain("figures=2");
    await sleep(1500); tvScreenshot("s8-tv-two-figures");
    await waitScreen("finish", 90_000);
    // 3 reps for me + 3 reps for Ana, counted separately and added together
    await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 30_000 }).toContain("together=6");
    expect(ana.moves).toEqual(["sit_to_stand"]); // Ana got the same move from the TV
  } finally { mom.close(); ana.close(); }
});

test("S8 two fake-camera browser pages: the TV shows both figures and a Together total", async ({ browser }) => {
  test.setTimeout(4 * 60_000);
  const code = await tvCode(["--es", "plan", "sit_to_stand:3", "--ei", "restSec", "1"]);
  const momPage = await newPhone(browser);
  await momPage.goto(`${endpoints.webUrl}/?code=${code}&delegate=cpu`);
  await expect(momPage.locator("#status")).toHaveText("Connected", { timeout: 20_000 });
  await openTogether();
  const room = await roomCode();
  const anaPage = await newPhone(browser);
  await anaPage.goto(`${endpoints.webUrl}/together.html?room=${room}&name=Ana&delegate=cpu`);
  await expect(anaPage.locator("#status")).toHaveText("You joined.", { timeout: 20_000 });
  await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 15_000 }).toContain("guest=Ana");
  pressOk();
  await waitScreen("intro:0"); pressOk();
  await waitScreen("live:0");
  await expect(momPage.locator("#seen")).toHaveText("I can see you.", { timeout: 60_000 });
  await expect(anaPage.locator("#seen")).toHaveText("I can see you.", { timeout: 60_000 });
  await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 60_000 }).toContain("figures=2");
  await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 30_000 }).toMatch(/together=\d+/);
  await sleep(1500);
  tvScreenshot("s8-tv-two-cameras");
  await anaPage.screenshot({ path: "docs/screens/s8-ana-phone.png" });
});
