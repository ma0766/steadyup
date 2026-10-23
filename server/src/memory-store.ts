import type { CodeRec, ConnRec, RoomRec, Store } from "./pairing";
import type { SetRec } from "./summary";
import type { Plan } from "./plan";

// In-memory Store for tests and the local dev stand-in.
export function memoryStore(): Store {
  const codes = new Map<string, CodeRec>();
  const conns = new Map<string, ConnRec>();
  const sets = new Map<string, SetRec>();
  const plans = new Map<string, Plan>();
  const rooms = new Map<string, RoomRec>();
  return {
    async putCode(r) { if (codes.has(r.code)) return false; codes.set(r.code, { ...r }); return true; },
    async getCode(c) { const r = codes.get(c); return r && { ...r }; },
    async claimCode(c, p, now) {
      const r = codes.get(c);
      if (!r || r.used || r.expiresAt <= now) return false;
      r.used = true; r.phoneConn = p; return true;
    },
    async getConn(id) { const r = conns.get(id); return r && { ...r }; },
    async putConn(r) { conns.set(r.connId, { ...r }); },
    async delConn(id) { conns.delete(id); },
    async putSet(home, r) { sets.set(`${home}|${r.day}|${r.session}|${r.idx}`, { ...r }); },
    async putRoom(r) { if (rooms.has(r.code)) return false; rooms.set(r.code, { ...r, guests: [...r.guests] }); return true; },
    async getRoom(c) { const r = rooms.get(c); return r && { ...r, guests: [...r.guests] }; },
    async addGuest(c, conn) { rooms.get(c)?.guests.push(conn); },
    async getPlan(home) { const p = plans.get(home); return p && JSON.parse(JSON.stringify(p)); },
    async putPlan(home, plan) { plans.set(home, JSON.parse(JSON.stringify(plan))); },
    async listSets(home, from, to) {
      return [...sets.entries()].filter(([k, r]) => k.startsWith(home + "|") && r.day >= from && r.day <= to).map(([, r]) => ({ ...r }));
    },
  };
}
