import { describe, it, expect, beforeEach } from "vitest";
import { handle, CODE_TTL_MS, FRIENDLY, type Deps } from "./pairing";
import { memoryStore } from "./memory-store";

let sent: { to: string; msg: any }[];
let clock: number;
let codes: string[];
let deps: Deps;
beforeEach(() => {
  sent = []; clock = 1_000_000; codes = ["111111", "222222", "333333", "444444"];
  deps = { store: memoryStore(), now: () => clock, genCode: () => codes.shift() ?? "000000",
    send: async (to, text) => { let msg: any = text; try { msg = JSON.parse(text); } catch {} sent.push({ to, msg }); return true; } };
});
const to = (id: string) => sent.filter((s) => s.to === id).map((s) => s.msg);
const say = (conn: string, o: unknown) => handle("$default", conn, JSON.stringify(o), deps);

async function paired() { // TV + its phone, then the TV opens a room
  await say("tv", { type: "hello", role: "tv" });
  await say("ph", { type: "join", code: "111111" });
  await say("tv", { type: "room-open" });
}

describe("S8 move together rooms", () => {
  it("opens a room and gives the TV a 6-digit number", async () => {
    await paired();
    expect(to("tv").at(-1)).toEqual({ type: "room", code: "222222" });
  });
  it("lets family join by number, tells both sides, and keeps the TV's own phone link", async () => {
    await paired();
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    expect(to("ana")).toEqual([{ type: "room-joined", name: "Ana" }]);
    expect(to("tv").at(-1)).toEqual({ type: "guest", event: "joined", name: "Ana" });
    await say("ph", { type: "rep", move: "sit_to_stand", count: 2 });
    expect(to("tv").at(-1)).toEqual({ type: "rep", move: "sit_to_stand", count: 2 }); // not tagged: it is "You"
  });
  it("tags a guest's messages so the TV can show a second figure", async () => {
    await paired();
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    await say("ana", { type: "pose", t: 5, p: [0.1, 0.2, 0.9] });
    await say("ana", { type: "rep", move: "sit_to_stand", count: 3 });
    expect(to("tv").at(-2)).toEqual({ type: "pose", t: 5, p: [0.1, 0.2, 0.9], guest: true, name: "Ana" });
    expect(to("tv").at(-1)).toMatchObject({ type: "rep", count: 3, guest: true, name: "Ana" });
    expect(to("ph").some((m) => m.guest)).toBe(false); // the TV's own phone never sees guest traffic
  });
  it("broadcasts the TV's move to the guest, and only from the host TV", async () => {
    await paired();
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    await say("tv", { type: "room-broadcast", msg: { type: "move", move: "heel_raise", target: 10, seq: 1 } });
    expect(to("ana").at(-1)).toEqual({ type: "move", move: "heel_raise", target: 10, seq: 1 });
    await say("ph", { type: "room-broadcast", msg: { type: "move", move: "march", target: 1 } }); // a phone cannot broadcast
    expect(to("ana").at(-1)).toMatchObject({ move: "heel_raise" });
  });
  it("refuses a wrong, malformed or expired family number with a friendly sentence", async () => {
    await paired();
    await say("a", { type: "room-join", code: "999999" });
    expect(to("a")).toEqual([{ type: "error", message: FRIENDLY.noRoom }]);
    await say("b", { type: "room-join", code: "12" });
    expect(to("b")[0].message).toBe(FRIENDLY.badInput);
    clock += CODE_TTL_MS * 6 + 1;
    await say("c", { type: "room-join", code: "222222" });
    expect(to("c")[0].message).toBe(FRIENDLY.noRoom);
  });
  it("refuses when the host TV has gone", async () => {
    await paired();
    await handle("$disconnect", "tv", undefined, deps);
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    expect(to("ana").at(-1)).toEqual({ type: "error", message: FRIENDLY.noRoom });
  });
  it("cleans odd names and tells the TV when a guest leaves", async () => {
    await paired();
    await say("ana", { type: "room-join", code: "222222", name: "<script>" });
    expect(to("tv").at(-1)).toEqual({ type: "guest", event: "joined", name: "Guest" });
    await handle("$disconnect", "ana", undefined, deps);
    expect(to("tv").at(-1)).toEqual({ type: "guest", event: "left", name: "Guest" });
  });
  it("holds one guest: a second person is told the room is full", async () => {
    await paired();
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    await say("bo", { type: "room-join", code: "222222", name: "Bo" });
    expect(to("bo")).toEqual([{ type: "error", message: FRIENDLY.roomFull }]);
    expect(to("tv").filter((m) => m.type === "guest")).toHaveLength(1);
  });
  it("does not let a paired phone or a guest take another role", async () => {
    await paired();
    await say("ph", { type: "room-open" });                                   // a phone cannot host
    expect(to("ph").some((m) => m.type === "room")).toBe(false);
    await say("ph", { type: "room-join", code: "222222", name: "Me" });      // nor become a guest
    expect(to("ph").at(-1)).toEqual({ type: "error", message: FRIENDLY.noRoom });
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });    // repeat join does nothing new
    expect(to("tv").filter((m) => m.type === "guest")).toHaveLength(1);
  });
  it("strips guest tags from anyone but a real guest", async () => {
    await paired();
    await say("ph", { type: "rep", move: "march", count: 1, guest: true, name: "Fake" });
    expect(to("tv").at(-1)).toEqual({ type: "rep", move: "march", count: 1 });
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    await say("ana", { type: "rep", move: "march", count: 2, name: "Spoof" });
    expect(to("tv").at(-1)).toMatchObject({ guest: true, name: "Ana" });
  });
  it("tells guests when the host TV leaves", async () => {
    await paired();
    await say("ana", { type: "room-join", code: "222222", name: "Ana" });
    await handle("$disconnect", "tv", undefined, deps);
    expect(to("ana").at(-1)).toEqual({ type: "peer-left" });
  });
});
