import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { endpoints } from "../endpoints";
import { ScriptedPhone } from "../scriptedPhone";
import { tvCode, tvScreenshot, pressOk, pressKey, waitScreen, logcat, sleep } from "../tv";
import { newPhone, closePhones } from "../phone";

test.afterEach(closePhones);

test("S9 calibration: two slow stands, one unclear try is repeated, then the first set starts", async () => {
  test.setTimeout(3 * 60_000);
  const code = await tvCode(["--es", "plan", "sit_to_stand:3", "--ez", "calibrate", "true", "--ei", "restSec", "1"]);
  const phone = new ScriptedPhone(endpoints.wsUrl);
  phone.calibrationUnclearTimes = 1; // first try: only one stand, so the TV asks again
  try {
    await phone.join(code);
    await waitScreen("safety"); pressOk();
    await waitScreen("home"); pressOk();                 // Start today's 10 minutes
    await waitScreen("calibrate"); await sleep(2500); tvScreenshot("s9-calibrate");
    await expect.poll(() => logcat("SteadyUpTts"), { timeout: 60_000 }).toContain("say: Let's try once more.");
    await waitScreen("intro:0", 90_000);                 // learned this time: on to the first set
    pressOk();
    await waitScreen("live:0");
    await waitScreen("finish", 90_000);                  // counts with their own levels
    expect(logcat("SteadyUpFlow")).toContain("totals=Sit to stand:3");
  } finally { phone.close(); }
});

test("S9 CDC chair stand: question, optional age and sex, 30 seconds, score next to the CDC number, trend on the family page", async ({ browser }) => {
  test.setTimeout(5 * 60_000);
  const home = randomBytes(16).toString("hex");
  const code = await tvCode(["--es", "home", home]);
  const phone = new ScriptedPhone(endpoints.wsUrl);
  try {
    await phone.join(code);
    await waitScreen("safety"); pressOk();
    await waitScreen("home"); await sleep(600);
    pressKey("KEYCODE_DPAD_DOWN"); await sleep(300); pressKey("KEYCODE_DPAD_RIGHT"); await sleep(500); pressOk(); // 2x2 grid: Chair stand check is bottom right
    await waitScreen("chair-ask"); tvScreenshot("s9-chair-1-question"); pressOk();                    // "Yes"
    await waitScreen("chair-about"); pressOk(); await sleep(300); pressOk();                          // age: 65 to 69
    pressKey("KEYCODE_DPAD_DOWN"); await sleep(300); pressOk();                                         // sex: Woman
    await sleep(500); tvScreenshot("s9-chair-2-about");
    pressKey("KEYCODE_DPAD_DOWN"); await sleep(300); pressOk();                                         // Next
    await waitScreen("chair-how"); tvScreenshot("s9-chair-3-how"); pressOk();
    await waitScreen("chair-ready", 15_000);
    await waitScreen("chair-go", 15_000); await sleep(9000); tvScreenshot("s9-chair-4-go");
    await waitScreen("chair-result", 60_000); await sleep(1200); tvScreenshot("s9-chair-5-result");
    expect(logcat("SteadyUpFlow")).toContain("chair=12");

    // the family page shows the trend within 10 s
    const family = await newPhone(browser);
    await family.setViewportSize({ width: 390, height: 844 });
    await family.goto(`${endpoints.webUrl}/family.html?h=${home}`);
    await expect(family.locator("#chair-now")).toHaveText("12 stands in 30 seconds", { timeout: 10_000 });
    await expect(family.locator("#chair-compare")).toHaveText("First check saved.");
    await family.screenshot({ path: "docs/screens/s9-family-chair.png" });
  } finally { phone.close(); }
});

test("S9 chair stand: 'No' skips the test with a kind sentence", async () => {
  const code = await tvCode([]);
  const phone = new ScriptedPhone(endpoints.wsUrl);
  try {
    await phone.join(code);
    await waitScreen("safety"); pressOk();
    await waitScreen("home"); await sleep(600);
    pressKey("KEYCODE_DPAD_DOWN"); await sleep(300); pressKey("KEYCODE_DPAD_RIGHT"); await sleep(500); pressOk();
    await waitScreen("chair-ask");
    pressKey("KEYCODE_DPAD_RIGHT"); await sleep(300); pressOk();                   // "No" sits to the right of "Yes"
    await waitScreen("chair-no"); tvScreenshot("s9-chair-no");
    pressOk(); await expect.poll(() => logcat("SteadyUpFlow").split("shown=home").length, { timeout: 10_000 }).toBeGreaterThan(2);
  } finally { phone.close(); }
});

test("S9 the real phone page answers a calibration request (fake camera, scripted TV)", async ({ browser }) => {
  test.setTimeout(2 * 60_000);
  const { default: WebSocket } = await import("ws");
  const tv = new WebSocket(endpoints.wsUrl);
  const got: any[] = [];
  const code: string = await new Promise((resolve, reject) => {
    tv.on("open", () => tv.send(JSON.stringify({ type: "hello", role: "tv" })));
    tv.on("message", (m) => { const j = JSON.parse(m.toString()); got.push(j); if (j.type === "code") resolve(j.code); });
    tv.on("error", reject);
  });
  const page = await newPhone(browser);
  await page.goto(`${endpoints.webUrl}/?code=${code}&delegate=cpu&calms=9000`);
  await expect(page.locator("#status")).toHaveText("Connected", { timeout: 20_000 });
  await expect(page.locator("#seen")).toHaveText("I can see you.", { timeout: 60_000 });
  tv.send(JSON.stringify({ type: "calibrate" }));
  await expect.poll(() => got.filter((m) => m.type === "cal").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => got.some((m) => m.type === "cal" && (m.state === "done" || m.state === "unclear")), { timeout: 30_000 }).toBe(true);
  const final = got.filter((m) => m.type === "cal").at(-1);
  expect(["done", "unclear", "progress"]).toContain(final.state); // a squat video may or may not be two clear stands: either answer is fine, silence is not
  await expect(page.locator("#note")).toContainText("Stand up slowly");
  tv.close();
});

test("S9 record the key screens: 2x2 home grid, a live set part-way through, the finish", async () => {
  test.setTimeout(3 * 60_000);
  const code = await tvCode(["--es", "plan", "sit_to_stand:8", "--ei", "restSec", "1"]);
  const phone = new ScriptedPhone(endpoints.wsUrl);
  phone.kneesCaveFirstSet = true;
  try {
    await phone.join(code);
    await waitScreen("safety"); pressOk();
    await waitScreen("home"); tvScreenshot("s9-home-grid"); pressOk();
    await waitScreen("intro:0"); pressOk();
    await waitScreen("live:0"); await sleep(8500); tvScreenshot("s9-live-midset");
    await waitScreen("finish", 90_000); await sleep(800); tvScreenshot("s9-finish");
  } finally { phone.close(); }
});
