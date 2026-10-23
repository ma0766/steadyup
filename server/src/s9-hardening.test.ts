import { describe, it, expect, beforeEach } from "vitest";
import { handle, FRIENDLY, TRY_LIMIT, ROOM_TTL_MS, type Deps } from "./pairing";
import { memoryStore } from "./memory-store";
import { route } from "./api";
import { summarize, type SetRec } from "./summary";

let sent: { to: string; msg: any }[];
let clock: number;
let codes: string[];
let deps: Deps;
beforeEach(() => {
  sent = []; clock = 5_000_000; codes = ["111111", "222222", "333333", "444444", "555555"];
  deps = { store: memoryStore(), now: () => clock, addr: "1.2.3.4", genCode: () => codes.shift() ?? "000000",
    send: async (to, text) => { let msg: any = text; try { msg = JSON.parse(text); } catch {} sent.push({ to, msg }); return true; } };
});
const to = (id: string) => sent.filter((s) => s.to === id).map((s) => s.msg);
const say = (conn: string, o: unknown) => handle("$default", conn, JSON.stringify(o), deps);

describe("S9 wrong-number limit: 5 wrong tries a minute per address, then a one-minute wait", () => {
  it("blocks the 6th try, even with the right number, and says so kindly", async () => {
    await say("tv", { type: "hello", role: "tv" });
    for (let i = 0; i < TRY_LIMIT.tries; i++) await say(`p${i}`, { type: "join", code: "999999" });
    await say("late", { type: "join", code: "111111" }); // the right number, but we are in the wait
    expect(to("late")).toEqual([{ type: "error", message: FRIENDLY.slowDown }]);
    expect(FRIENDLY.slowDown.split(" ").length).toBeLessThan(12);
  });
  it("lets the right number in again after a minute", async () => {
    await say("tv", { type: "hello", role: "tv" });
    for (let i = 0; i < TRY_LIMIT.tries; i++) await say(`p${i}`, { type: "join", code: "999999" });
    clock += TRY_LIMIT.blockMs + 1;
    await say("ok", { type: "join", code: "111111" });
    expect(to("ok")).toEqual([{ type: "paired" }]);
  });
  it("does not block four wrong tries, and tries spread over minutes never add up", async () => {
    await say("tv", { type: "hello", role: "tv" });
    for (let i = 0; i < 4; i++) await say(`p${i}`, { type: "join", code: "999999" });
    await say("ok", { type: "join", code: "111111" });
    expect(to("ok")).toEqual([{ type: "paired" }]);
    for (let i = 0; i < 12; i++) { clock += 20_000; await say(`w${i}`, { type: "join", code: "999998" }); }
    expect(to("w11")[0].message).toBe(FRIENDLY.unknown); // spaced out: never blocked
  });
  it("counts per address: one person's wrong tries do not block someone else", async () => {
    await say("tv", { type: "hello", role: "tv" });
    for (let i = 0; i < TRY_LIMIT.tries; i++) await say(`p${i}`, { type: "join", code: "999999" });
    deps = { ...deps, addr: "9.9.9.9" };
    await say("other", { type: "join", code: "111111" });
    expect(to("other")).toEqual([{ type: "paired" }]);
  });
  it("also limits wrong family (room) numbers", async () => {
    for (let i = 0; i < TRY_LIMIT.tries; i++) await say(`g${i}`, { type: "room-join", code: "999999", name: "Ana" });
    await say("gl", { type: "room-join", code: "999999", name: "Ana" });
    expect(to("gl")).toEqual([{ type: "error", message: FRIENDLY.slowDown }]);
  });
});

describe("S9 rooms and names", () => {
  async function room() {
    await say("tv", { type: "hello", role: "tv" });
    await say("ph", { type: "join", code: "111111" });
    await say("tv", { type: "room-open" });
  }
  it("keeps accents and other letters in names", async () => {
    await room();
    await say("g", { type: "room-join", code: "222222", name: "José" });
    expect(to("tv").at(-1)).toEqual({ type: "guest", event: "joined", name: "José" });
    await say("g2", { type: "room-join", code: "222222", name: "x" }); // second guest: room is full, no crash
  });
  it("accepts Zoë and Søren, rejects markup", async () => {
    for (const [name, want] of [["Zoë", "Zoë"], ["Søren", "Søren"], ["<b>", "Guest"], ["Anne-Marie", "Anne-Marie"]] as const) {
      sent = []; deps = { ...deps, store: memoryStore() };
      await say("tv", { type: "hello", role: "tv" });
      await say("ph", { type: "join", code: codes.shift() ?? "000000" });
      codes.unshift("777777");
      await say("tv", { type: "room-open" });
      await say("g", { type: "room-join", code: "777777", name });
      expect(to("g")[0]).toEqual({ type: "room-joined", name: want });
      codes = ["111111", "222222", ...codes];
    }
  });
  it("opening a new room closes the old one, and rooms expire on their own", async () => {
    await room();
    await say("tv", { type: "room-open" }); // second room
    await say("late", { type: "room-join", code: "222222", name: "Ana" });
    expect(to("late")[0]).toEqual({ type: "error", message: FRIENDLY.noRoom });
    await say("g", { type: "room-join", code: "333333", name: "Ana" });
    expect(to("g")[0]).toMatchObject({ type: "room-joined" });
    expect(ROOM_TTL_MS).toBe(30 * 60 * 1000);
  });
  it("an expired room refuses joins", async () => {
    await room();
    clock += ROOM_TTL_MS + 1;
    await say("g", { type: "room-join", code: "222222", name: "Ana" });
    expect(to("g")[0]).toEqual({ type: "error", message: FRIENDLY.noRoom });
  });
});

describe("S9 chair stand history", () => {
  const rec = (day: string, score: number, ts: number): SetRec =>
    ({ session: `c${ts}`, idx: 0, move: "chair_stand_30", target: 30, done: score, cues: 0, day, ts });
  it("keeps a trend of scores, apart from workouts, sessions and streaks", () => {
    const s = summarize([rec("2026-10-10", 9, 1), rec("2026-10-17", 11, 2), rec("2026-10-22", 12, 3)], "2026-10-22");
    expect(s.chair).toEqual([{ day: "2026-10-10", score: 9 }, { day: "2026-10-17", score: 11 }, { day: "2026-10-22", score: 12 }]);
    expect(s.weekSessions).toBe(0); expect(s.streak).toBe(0); expect(s.last).toBeNull();
  });
  it("stores a score through the API and serves it in the summary", async () => {
    const store = memoryStore();
    const body = { home: "d".repeat(32), session: "chair1", idx: 0, move: "chair_stand_30", target: 30, done: 12, cues: 0, day: "2026-10-22", ts: 1_800_000_000_000 };
    expect((await route("POST", "/sets", {}, JSON.stringify(body), store)).statusCode).toBe(200);
    const sum = JSON.parse((await route("GET", "/summary", { home: "d".repeat(32), today: "2026-10-22" }, undefined, store)).body!);
    expect(sum.chair).toEqual([{ day: "2026-10-22", score: 12 }]);
  });
  it("keeps only the latest 8 scores", () => {
    const sets = Array.from({ length: 11 }, (_, i) => rec(`2026-10-${10 + i}`, 8 + i, i + 1));
    expect(summarize(sets, "2026-10-22").chair).toHaveLength(8);
  });
});
