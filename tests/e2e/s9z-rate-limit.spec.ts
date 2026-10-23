import { test, expect } from "@playwright/test";
import WebSocket from "ws";
import { endpoints } from "../endpoints";

// Runs last (the wrong tries are counted per address, and this test uses them all up), then waits the minute out.
const tryJoin = (code: string): Promise<string> => new Promise((resolve, reject) => {
  const ws = new WebSocket(endpoints.wsUrl);
  const t = setTimeout(() => reject(new Error("no answer")), 15_000);
  ws.on("open", () => ws.send(JSON.stringify({ type: "join", code })));
  ws.on("message", (m) => { clearTimeout(t); const j = JSON.parse(m.toString()); ws.close(); resolve(j.message ?? j.type); });
  ws.on("error", reject);
});

test("S9 five wrong numbers in a minute, then a one-minute wait with a kind sentence", async () => {
  test.setTimeout(6 * 60_000); // three one-minute waits
  await new Promise((r) => setTimeout(r, 62_000)); // start from a clean minute (earlier tests made a few wrong tries)
  const seen: string[] = [];
  for (let i = 0; i < 5; i++) seen.push(await tryJoin("000000"));
  expect(seen.every((m) => m.startsWith("That number didn't work"))).toBe(true);
  expect(await tryJoin("000000")).toBe("Too many tries. Please wait a minute.");
  await new Promise((r) => setTimeout(r, 62_000));
  expect(await tryJoin("000000")).toBe("That number didn't work. Check the number on your TV."); // the wait is over
  await new Promise((r) => setTimeout(r, 62_000)); // leave a clean slate for whoever runs next
});
