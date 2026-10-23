// Pairing + relay core. Pure logic behind a Store interface so unit tests need no AWS.
// Flow: TV says hello -> gets a 6-digit code (10 min, single use). Phone says join -> both told "paired".
// After pairing every other JSON message is relayed to the peer unchanged (relay = dumb pipe).
import { z } from "zod";
import { randomInt } from "node:crypto";
import type { SetRec } from "./summary";
import type { Plan } from "./plan";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const FRIENDLY = {
  unknown: "That number didn't work. Check the number on your TV.",
  expired: "That number ran out of time. Look at the TV for a new one.",
  used: "That number was already used. Look at the TV for a new one.",
  tvGone: "The TV isn't ready. Look at the TV for a new number.",
  badInput: "Type the 6 numbers from your TV.",
  noRoom: "That family number didn't work. Ask for a new one.",
  roomFull: "That room is full right now.",
} as const;

export interface CodeRec { code: string; tvConn: string; expiresAt: number; used: boolean; phoneConn?: string }
export interface ConnRec { connId: string; role: "tv" | "phone" | "guest"; code?: string; peer?: string; room?: string; name?: string }
export interface RoomRec { code: string; tvConn: string; expiresAt: number; guests: string[] }
export interface Store {
  putCode(rec: CodeRec): Promise<boolean>; // false if code already exists
  getCode(code: string): Promise<CodeRec | undefined>;
  claimCode(code: string, phoneConn: string, now: number): Promise<boolean>; // atomic: unused and unexpired
  getConn(id: string): Promise<ConnRec | undefined>;
  putConn(rec: ConnRec): Promise<void>;
  delConn(id: string): Promise<void>;
  putSet(home: string, rec: SetRec): Promise<void>;                  // idempotent: same session+idx overwrites
  listSets(home: string, fromDay: string, toDay: string): Promise<SetRec[]>;
  putRoom(rec: RoomRec): Promise<boolean>;
  getRoom(code: string): Promise<RoomRec | undefined>;
  addGuest(code: string, conn: string): Promise<void>;
  getPlan(home: string): Promise<Plan | undefined>;
  putPlan(home: string, plan: Plan): Promise<void>;
}
export interface Deps {
  store: Store;
  send: (connId: string, text: string) => Promise<boolean>; // false when the peer is gone
  now: () => number;
  genCode: () => string;
}

const Hello = z.object({ type: z.literal("hello"), role: z.literal("tv") });
const Join = z.object({ type: z.literal("join"), code: z.string() });
const Ping = z.object({ type: z.literal("ping"), t: z.number() });
const RoomOpen = z.object({ type: z.literal("room-open") });
const RoomJoin = z.object({ type: z.literal("room-join"), code: z.string(), name: z.string().optional() });
const RoomBroadcast = z.object({ type: z.literal("room-broadcast"), msg: z.record(z.unknown()) });

export const randomCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0"); // CSPRNG: codes are a credential
const json = (o: unknown) => JSON.stringify(o);

export async function handle(routeKey: string, connId: string, body: string | undefined, d: Deps): Promise<void> {
  if (routeKey === "$disconnect") return onDisconnect(connId, d);
  if (routeKey !== "$default" || body === undefined) return;

  let msg: unknown;
  try { msg = JSON.parse(body); } catch { await d.send(connId, body); return; } // S0 echo for non-JSON
  if (typeof msg !== "object" || msg === null) { await d.send(connId, body); return; }

  const hello = Hello.safeParse(msg);
  if (hello.success) return onHello(connId, d);
  const join = Join.safeParse(msg);
  if (join.success) return onJoin(connId, join.data.code, d);
  const ping = Ping.safeParse(msg);
  if (ping.success) { await d.send(connId, json({ type: "pong", t: ping.data.t })); return; }

  const open = RoomOpen.safeParse(msg);
  if (open.success) return onRoomOpen(connId, d);
  const rjoin = RoomJoin.safeParse(msg);
  if (rjoin.success) return onRoomJoin(connId, rjoin.data.code, rjoin.data.name, d);
  const bc = RoomBroadcast.safeParse(msg);
  if (bc.success) return onRoomBroadcast(connId, bc.data.msg, d);

  // everything else: relay to the paired peer (a guest's messages go to the host TV, tagged so the TV can tell them apart)
  const me = await d.store.getConn(connId);
  if (!me?.peer) return;
  // a guest's messages are tagged by the server (never by the client); anyone else's tags are stripped so nobody can pose as a guest
  const { guest: _g, name: _n, ...clean } = msg as Record<string, unknown>;
  const out = me.role === "guest" ? JSON.stringify({ ...clean, guest: true, name: me.name }) : JSON.stringify(clean);
  const ok = await d.send(me.peer, out);
  if (!ok) await d.send(connId, json({ type: "peer-left" }));
}

async function onHello(tvConn: string, d: Deps) {
  for (let i = 0; i < 5; i++) {
    const code = d.genCode();
    const created = await d.store.putCode({ code, tvConn, expiresAt: d.now() + CODE_TTL_MS, used: false });
    if (!created) continue;
    await d.store.putConn({ connId: tvConn, role: "tv", code });
    await d.send(tvConn, json({ type: "code", code, expiresInSec: CODE_TTL_MS / 1000 }));
    return;
  }
}

async function onJoin(phoneConn: string, raw: string, d: Deps) {
  const code = raw.trim();
  const fail = (m: string) => d.send(phoneConn, json({ type: "error", message: m }));
  if (!/^\d{6}$/.test(code)) return void (await fail(FRIENDLY.badInput));
  const rec = await d.store.getCode(code);
  if (!rec) return void (await fail(FRIENDLY.unknown));
  if (rec.used) return void (await fail(FRIENDLY.used));
  if (rec.expiresAt <= d.now()) return void (await fail(FRIENDLY.expired));
  if (!(await d.store.getConn(rec.tvConn))) return void (await fail(FRIENDLY.tvGone)); // TV socket already closed: do not burn the code
  if (!(await d.store.claimCode(code, phoneConn, d.now()))) return void (await fail(FRIENDLY.used));
  await d.store.putConn({ connId: phoneConn, role: "phone", code, peer: rec.tvConn });
  await d.store.putConn({ connId: rec.tvConn, role: "tv", code, peer: phoneConn });
  await d.send(rec.tvConn, json({ type: "paired" }));
  await d.send(phoneConn, json({ type: "paired" }));
}

async function onDisconnect(connId: string, d: Deps) {
  const me = await d.store.getConn(connId);
  await d.store.delConn(connId);
  if (me?.role === "guest" && me.peer) { await d.send(me.peer, json({ type: "guest", event: "left", name: me.name })); return; }
  if (me?.peer) await d.send(me.peer, json({ type: "peer-left" }));
  if (me?.role === "tv" && me.room) { // host left: tell every guest
    const room = await d.store.getRoom(me.room);
    for (const g of room?.guests ?? []) await d.send(g, json({ type: "peer-left" }));
  }
}

// "Move together": the TV opens a room (6-digit number, 10 minutes). Family joins from their own phone and camera.
async function onRoomOpen(tvConn: string, d: Deps) {
  const me = await d.store.getConn(tvConn);
  if (me?.role !== "tv") return; // only a TV that said hello can host a room
  for (let i = 0; i < 5; i++) {
    const code = d.genCode();
    if (!(await d.store.putRoom({ code, tvConn, expiresAt: d.now() + CODE_TTL_MS * 6, guests: [] }))) continue;
    await d.store.putConn({ ...(me ?? { connId: tvConn, role: "tv" as const }), connId: tvConn, role: "tv", room: code });
    await d.send(tvConn, json({ type: "room", code }));
    return;
  }
}

const cleanName = (n?: string) => (n && /^[A-Za-z][A-Za-z '-]{0,15}$/.test(n.trim()) ? n.trim() : "Guest");

async function onRoomJoin(conn: string, raw: string, name: string | undefined, d: Deps) {
  const code = raw.trim();
  const fail = (m: string) => d.send(conn, json({ type: "error", message: m }));
  if (!/^\d{6}$/.test(code)) return void (await fail(FRIENDLY.badInput));
  if (await d.store.getConn(conn)) return void (await fail(FRIENDLY.noRoom)); // a connection that already has a role cannot become a guest
  const room = await d.store.getRoom(code);
  if (!room || room.expiresAt <= d.now()) return void (await fail(FRIENDLY.noRoom));
  if (!(await d.store.getConn(room.tvConn))) return void (await fail(FRIENDLY.noRoom)); // host TV already gone
  if (room.guests.length >= 1) return void (await fail(FRIENDLY.roomFull)); // the TV shows one guest
  const who = cleanName(name);
  await d.store.addGuest(code, conn);
  await d.store.putConn({ connId: conn, role: "guest", peer: room.tvConn, room: code, name: who });
  await d.send(conn, json({ type: "room-joined", name: who }));
  await d.send(room.tvConn, json({ type: "guest", event: "joined", name: who }));
}

async function onRoomBroadcast(tvConn: string, msg: Record<string, unknown>, d: Deps) {
  const me = await d.store.getConn(tvConn);
  if (me?.role !== "tv" || !me.room) return;
  const room = await d.store.getRoom(me.room);
  const text = json(msg);
  for (const g of room?.guests ?? []) await d.send(g, text);
}
