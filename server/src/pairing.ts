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
} as const;

export interface CodeRec { code: string; tvConn: string; expiresAt: number; used: boolean; phoneConn?: string }
export interface ConnRec { connId: string; role: "tv" | "phone"; code?: string; peer?: string }
export interface Store {
  putCode(rec: CodeRec): Promise<boolean>; // false if code already exists
  getCode(code: string): Promise<CodeRec | undefined>;
  claimCode(code: string, phoneConn: string, now: number): Promise<boolean>; // atomic: unused and unexpired
  getConn(id: string): Promise<ConnRec | undefined>;
  putConn(rec: ConnRec): Promise<void>;
  delConn(id: string): Promise<void>;
  putSet(home: string, rec: SetRec): Promise<void>;                  // idempotent: same session+idx overwrites
  listSets(home: string, fromDay: string, toDay: string): Promise<SetRec[]>;
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

  // everything else: relay to the paired peer
  const me = await d.store.getConn(connId);
  if (!me?.peer) return;
  const ok = await d.send(me.peer, body);
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
  if (me?.peer) await d.send(me.peer, json({ type: "peer-left" }));
}
