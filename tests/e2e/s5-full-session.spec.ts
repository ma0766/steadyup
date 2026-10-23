import { test, expect } from "@playwright/test";
import { endpoints } from "../endpoints";
import { ScriptedPhone } from "../scriptedPhone";
import { tvCode, tvScreenshot, pressOk, waitScreen, logcat } from "../tv";
import fs from "node:fs";

// The default ten-set plan (about 10 minutes of exercise), time-compressed: the scripted phone plays each set from
// SYNTHETIC landmarks through the real engines at ~2.7x speed and rests are 2 s instead of 20 s.
test("S5 a full ten-set session with all five moves completes", async () => {
  test.setTimeout(8 * 60_000);
  const code = await tvCode(["--ei", "restSec", "2"]);
  const phone = new ScriptedPhone(endpoints.wsUrl);
  try {
    await phone.join(code);
    await waitScreen("safety"); pressOk();
    await waitScreen("home"); pressOk();
    for (let i = 0; i < 10; i++) {
      await waitScreen(`intro:${i}`, 120_000);
      if (i === 2 || i === 4 || i === 5) tvScreenshot(`s5-intro-${i}`);
      pressOk();
      await waitScreen(`live:${i}`);
      if (i === 5) await new Promise((r) => setTimeout(r, 2500)), tvScreenshot("s5-live-hold");
    }
    await waitScreen("finish", 180_000);
    tvScreenshot("s5-finish");
    const flow = logcat("SteadyUpFlow");
    const totals = /totals=(.*)/.exec(flow)![1];
    expect(totals).toBe("Sit to stand:16,Heel raises:20,Leg out to the side, left:8,Leg out to the side, right:8,March in place:24,Foot in front (seconds):40");
    expect(phone.moves).toEqual(["sit_to_stand", "heel_raise", "side_leg_raise", "side_leg_raise", "march", "tandem_hold",
      "sit_to_stand", "heel_raise", "march", "tandem_hold"]);
    fs.writeFileSync("docs/screens/s5-session-totals.txt", totals + "\n");
  } finally { phone.close(); }
});
