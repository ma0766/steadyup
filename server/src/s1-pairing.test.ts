import { describe, it, expect, beforeEach } from "vitest";
import { handle, CODE_TTL_MS, FRIENDLY, type Deps } from "./pairing";
import { memoryStore } from "./memory-store";

let sent: { to: string; msg: any }[];
let clock: number;
let codes: string[];
let deps: Deps;

beforeEach(() => {
  sent = []; clock = 1_000_000; codes = ["123456", "654321"];
  deps = {
    store: memoryStore(),
    now: () => clock,
    genCode: () => codes.shift() ?? "000000",
    send: async (to, text) => { let msg: any = text; try { msg = JSON.parse(text); } catch {} sent.push({ to, msg }); return true; },
  };
});
const to = (id: string) => sent.filter((s) => s.to === id).map((s) => s.msg);
const say = (conn: string, o: unknown) => handle("$default", conn, JSON.stringify(o), deps);

describe("S1 pairing", () => {
  it("gives the TV a 6-digit code", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    expect(to("tv1")[0]).toMatchObject({ type: "code", code: "123456", expiresInSec: 600 });
  });

  it("pairs the phone and tells both sides", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    await say("ph1", { type: "join", code: "123456" });
    expect(to("tv1").at(-1)).toEqual({ type: "paired" });
    expect(to("ph1")).toEqual([{ type: "paired" }]);
  });

  it("refuses a wrong code with a friendly sentence", async () => {
    await say("ph1", { type: "join", code: "999999" });
    expect(to("ph1")).toEqual([{ type: "error", message: FRIENDLY.unknown }]);
  });

  it("refuses a code that is not 6 numbers", async () => {
    await say("ph1", { type: "join", code: "12ab" });
    expect(to("ph1")[0].message).toBe(FRIENDLY.badInput);
  });

  it("refuses an expired code", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    clock += CODE_TTL_MS + 1;
    await say("ph1", { type: "join", code: "123456" });
    expect(to("ph1")).toEqual([{ type: "error", message: FRIENDLY.expired }]);
  });

  it("refuses a reused code (single use)", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    await say("ph1", { type: "join", code: "123456" });
    await say("ph2", { type: "join", code: "123456" });
    expect(to("ph2")).toEqual([{ type: "error", message: FRIENDLY.used }]);
  });

  it("does not pair with a TV that already disconnected, and keeps the code unused", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    await handle("$disconnect", "tv1", undefined, deps);
    await say("ph1", { type: "join", code: "123456" });
    expect(to("ph1")).toEqual([{ type: "error", message: FRIENDLY.tvGone }]);
  });

  it("retries when a generated code is already taken", async () => {
    codes = ["111111", "111111", "222222"];
    await say("tv1", { type: "hello", role: "tv" });
    await say("tv2", { type: "hello", role: "tv" });
    expect(to("tv2")[0].code).toBe("222222");
  });

  it("relays other messages between paired peers only", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    await say("ph1", { type: "join", code: "123456" });
    await say("ph1", { type: "rep", move: "sit", count: 3 });
    expect(to("tv1").at(-1)).toEqual({ type: "rep", move: "sit", count: 3 });
    await say("stranger", { type: "rep", move: "sit", count: 9 });
    expect(to("tv1").at(-1)).toEqual({ type: "rep", move: "sit", count: 3 });
  });

  it("tells the peer when someone leaves", async () => {
    await say("tv1", { type: "hello", role: "tv" });
    await say("ph1", { type: "join", code: "123456" });
    await handle("$disconnect", "ph1", undefined, deps);
    expect(to("tv1").at(-1)).toEqual({ type: "peer-left" });
  });

  it("answers ping with pong and still echoes plain text", async () => {
    await say("ph1", { type: "ping", t: 42 });
    expect(to("ph1")[0]).toEqual({ type: "pong", t: 42 });
    await handle("$default", "ph1", "ping-s0", deps);
    expect(to("ph1")[1]).toBe("ping-s0");
  });

  it("friendly sentences stay under 12 words", () => {
    for (const s of Object.values(FRIENDLY)) for (const sentence of s.split(/[.?!]\s*/).filter(Boolean)) expect(sentence.split(" ").length).toBeLessThan(12);
  });
});
