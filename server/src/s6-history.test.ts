import { describe, it, expect } from "vitest";
import { route, SetBody } from "./api";
import { memoryStore } from "./memory-store";
import { addDays, summarize, type SetRec } from "./summary";

const HOME = "a".repeat(32);
const set = (day: string, session: string, idx = 0, over: Partial<SetRec> = {}): SetRec =>
  ({ session, idx, move: "sit_to_stand", target: 8, done: 8, cues: 0, day, ts: Date.parse(day + "T12:00:00Z") + idx, ...over });

describe("S6 weekly summary", () => {
  const today = "2026-10-22";
  it("counts sessions this week and last week", () => {
    const sets = [
      set("2026-10-22", "s1"), set("2026-10-22", "s1", 1), set("2026-10-21", "s2"), set("2026-10-19", "s3"), set("2026-10-17", "s4"),
      set("2026-10-14", "p1"), set("2026-10-12", "p2"),
    ];
    const s = summarize(sets, today);
    expect(s.weekSessions).toBe(4);       // s1..s4 are in Oct 16..22
    expect(s.prevWeekSessions).toBe(2);   // p1, p2 in Oct 9..15
  });
  it("counts the streak of consecutive days ending today", () => {
    expect(summarize([set("2026-10-22", "a"), set("2026-10-21", "b"), set("2026-10-20", "c"), set("2026-10-18", "d")], today).streak).toBe(3);
  });
  it("keeps the streak alive when today has no session yet", () => {
    expect(summarize([set("2026-10-21", "b"), set("2026-10-20", "c")], today).streak).toBe(2);
  });
  it("streak is 0 after a missed day", () => expect(summarize([set("2026-10-19", "a")], today).streak).toBe(0));
  it("does not treat a day recorded in another time zone as the future", () => {
    const s = summarize([set("2026-10-23", "x")], "2026-10-22"); // TV is already on the 23rd
    expect(s.today).toBe("2026-10-23");
    expect(s.weekSessions).toBe(1);
    expect(s.streak).toBe(1);
  });
  it("reports seven days, oldest first, and the last session's totals with units", () => {
    const sets = [set("2026-10-22", "s1", 0), set("2026-10-22", "s1", 1, { move: "tandem_hold", target: 20, done: 20 }), set("2026-10-22", "s1", 2, { move: "side_leg_raise", side: "left" })];
    const s = summarize(sets, today);
    expect(s.days.map((d) => d.day)).toEqual(Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)));
    expect(s.days[6]).toEqual({ day: today, sessions: 1, reps: 36 });
    expect(s.last!.totals).toEqual([
      { label: "Sit to stand", done: 8, unit: "reps" },
      { label: "Foot in front", done: 20, unit: "seconds" },
      { label: "Leg out to the side, left", done: 8, unit: "reps" },
    ]);
  });
  it("is empty and calm with no history", () => {
    const s = summarize([], today);
    expect(s).toMatchObject({ weekSessions: 0, prevWeekSessions: 0, streak: 0, last: null });
  });
});

describe("S6 HTTP API", () => {
  const body = { home: HOME, session: "abc", idx: 0, move: "heel_raise", target: 10, done: 10, cues: 1, day: "2026-10-22", ts: 1_800_000_000_000 };

  it("stores a set and serves it back in the summary", async () => {
    const store = memoryStore();
    expect((await route("POST", "/sets", {}, JSON.stringify(body), store)).statusCode).toBe(200);
    const r = await route("GET", "/summary", { home: HOME, today: "2026-10-22" }, undefined, store);
    expect(JSON.parse(r.body!).weekSessions).toBe(1);
  });
  it("is idempotent: the same set sent twice counts once", async () => {
    const store = memoryStore();
    await route("POST", "/sets", {}, JSON.stringify(body), store);
    await route("POST", "/sets", {}, JSON.stringify(body), store);
    const s = JSON.parse((await route("GET", "/summary", { home: HOME, today: "2026-10-22" }, undefined, store)).body!);
    expect(s.days[6].reps).toBe(10);
  });
  it("refuses body points or any extra field, so none can be stored", async () => {
    const store = memoryStore();
    const r = await route("POST", "/sets", {}, JSON.stringify({ ...body, landmarks: [[0.1, 0.2, 0.9]] }), store);
    expect(r.statusCode).toBe(400);
    expect(SetBody.safeParse({ ...body, p: [1, 2, 3] }).success).toBe(false);
    expect(await store.listSets(HOME, "2000-01-01", "2100-01-01")).toHaveLength(0);
  });
  it("refuses bad home ids with a friendly sentence", async () => {
    const r = await route("GET", "/summary", { home: "nope" }, undefined, memoryStore());
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.body!).error).toBe("That link did not work.");
  });
  it("keeps homes apart", async () => {
    const store = memoryStore();
    await route("POST", "/sets", {}, JSON.stringify(body), store);
    const other = JSON.parse((await route("GET", "/summary", { home: "b".repeat(32), today: "2026-10-22" }, undefined, store)).body!);
    expect(other.weekSessions).toBe(0);
  });
});
