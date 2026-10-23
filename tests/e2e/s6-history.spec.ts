import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { endpoints } from "../endpoints";
import { ScriptedPhone } from "../scriptedPhone";
import { tvCode, tvScreenshot, pressOk, pressKey, waitScreen, logcat, sleep } from "../tv";
import { newPhone, closePhones } from "../phone";

test.afterEach(closePhones);

test("S6 a finished session reaches the family page in 10 s, the TV week screen, and the table holds counts only", async ({ browser }) => {
  test.setTimeout(4 * 60_000);
  const home = randomBytes(16).toString("hex");
  const code = await tvCode(["--es", "plan", "sit_to_stand:3,heel_raise:3", "--ei", "restSec", "1", "--es", "home", home]);

  // family opens its link before the session: nothing yet
  const family = await newPhone(browser);
  await family.setViewportSize({ width: 390, height: 844 });
  await family.goto(`${endpoints.webUrl}/family.html?h=${home}`);
  await expect(family.locator("#sessions")).toHaveText("0 sessions this week", { timeout: 20_000 });

  const phone = new ScriptedPhone(endpoints.wsUrl);
  try {
    await phone.join(code);
    await waitScreen("safety"); pressOk();
    await waitScreen("home"); pressOk();
    await waitScreen("intro:0"); pressOk();
    await waitScreen("live:0");
    await waitScreen("intro:1", 60_000); pressOk();
    await waitScreen("live:1");
    await waitScreen("finish", 60_000);
    const finishedAt = Date.now();

    // the page refreshes itself; the finished session must show within 10 s of the finish screen
    await expect(family.locator("#sessions")).toHaveText("1 session this week", { timeout: 10_000 });
    expect(Date.now() - finishedAt).toBeLessThan(10_000);
    await expect(family.locator("#last")).toContainText("Sit to stand: 3");
    await expect(family.locator("#last")).toContainText("Heel raises: 3");
    await expect(family.locator("#streak")).toHaveText("1 day in a row");
    await family.screenshot({ path: "docs/screens/s6-family.png" });

    // TV "This week": Back to start, arrow down twice to "This week", OK
    pressOk();
    await sleep(2500);
    pressKey("KEYCODE_DPAD_DOWN"); await sleep(300); pressKey("KEYCODE_DPAD_DOWN"); await sleep(500); pressOk(); // Start, Move together, This week
    await waitScreen("week");
    await expect.poll(() => logcat("SteadyUpFlow"), { timeout: 15_000 }).toContain("week=sessions:1,streak:1");
    await sleep(1200);
    tvScreenshot("s6-tv-week");
  } finally { phone.close(); }

  // the table: counts only. No landmarks or any body-point field anywhere.
  const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  const mine = await db.send(new QueryCommand({ TableName: endpoints.tableName, KeyConditionExpression: "pk = :p", ExpressionAttributeValues: { ":p": `HOME#${home}` }, ConsistentRead: true }));
  expect(mine.Items).toHaveLength(2);
  const allowed = new Set(["pk", "sk", "session", "idx", "move", "side", "target", "done", "cues", "day", "ts", "ttl"]);
  for (const it of mine.Items!) {
    for (const k of Object.keys(it)) expect(allowed.has(k), `unexpected field ${k}`).toBe(true);
    for (const v of Object.values(it)) expect(Array.isArray(v) || (typeof v === "object" && v !== null)).toBe(false);
  }
  const bad = await db.send(new ScanCommand({ TableName: endpoints.tableName, FilterExpression: "attribute_exists(p) OR attribute_exists(lm) OR attribute_exists(landmarks) OR attribute_exists(pose)", Select: "COUNT" }));
  expect(bad.Count).toBe(0);
});
