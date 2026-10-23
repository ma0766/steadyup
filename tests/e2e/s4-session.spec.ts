import { test, expect } from "@playwright/test";
import { endpoints } from "../endpoints";
import { ScriptedPhone } from "../scriptedPhone";
import { tvCode, tvScreenshot, pressOk, waitScreen, logcat, sleep } from "../tv";

const PLAN = ["--es", "plan", "sit_to_stand:3,heel_raise:3,march:3", "--ei", "restSec", "2"];
let phone: ScriptedPhone | undefined;
test.afterEach(() => { phone?.close(); phone = undefined; });

test("S4 a scripted run completes a 3-move session with every screen", async () => {
  const code = await tvCode(PLAN);
  phone = new ScriptedPhone(endpoints.wsUrl);
  await phone.join(code);

  await waitScreen("safety"); tvScreenshot("s4-1-safety"); pressOk();
  await waitScreen("home"); tvScreenshot("s4-2-home"); pressOk();
  await waitScreen("intro:0"); tvScreenshot("s4-3-intro");
  expect(logcat("SteadyUpTts")).toContain("say: Hold the back of the chair.");
  pressOk();

  await waitScreen("live:0");
  await expect.poll(() => logcat("SteadyUpTts"), { timeout: 30_000 }).toContain("say: Keep knees over toes");
  tvScreenshot("s4-4-live");
  await waitScreen("rest:1", 90_000); tvScreenshot("s4-5-rest");
  await waitScreen("intro:1", 30_000); tvScreenshot("s4-6-intro-heel");
  pressOk();
  await waitScreen("live:1"); await sleep(1500); tvScreenshot("s4-7-live-heel");
  await waitScreen("rest:2", 90_000);
  pressOk(); // skip the rest with OK
  await waitScreen("intro:2", 15_000); pressOk();
  await waitScreen("live:2");
  await waitScreen("finish", 90_000); tvScreenshot("s4-8-finish");

  const flow = logcat("SteadyUpFlow");
  expect(flow).toContain("totals=Sit to stand:3,Heel raises:3,March in place:3");
  expect(phone.moves).toEqual(["sit_to_stand", "heel_raise", "march"]);
  // fixed lines wait for the 5 s gap, so give the last one time to be spoken
  await expect.poll(() => logcat("SteadyUpTts"), { timeout: 15_000 }).toContain("say: Well done. See you tomorrow.");
  expect((logcat("SteadyUpTts").match(/say: Hold the back of the chair\./g) ?? []).length).toBe(3);
});

test("S4 out of view for 10 seconds pauses, OK resumes", async () => {
  const code = await tvCode(PLAN);
  phone = new ScriptedPhone(endpoints.wsUrl);
  phone.autoRun = false;
  await phone.join(code);
  await waitScreen("safety"); pressOk();
  await waitScreen("home"); pressOk();
  await waitScreen("intro:0"); pressOk();
  await waitScreen("live:0");

  phone.outOfView();
  await sleep(5000);
  expect(logcat("SteadyUpFlow")).not.toContain("screen=paused"); // 5 s: still waiting
  await waitScreen("paused", 15_000); tvScreenshot("s4-9-paused");
  expect(logcat("SteadyUpTts")).toContain("say: Paused. Press OK when you're ready.");
  pressOk();
  await expect.poll(() => logcat("SteadyUpFlow").split("screen=live:0").length, { timeout: 10_000 }).toBeGreaterThan(2); // live again
});
