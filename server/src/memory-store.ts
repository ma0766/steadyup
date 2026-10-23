import type { CodeRec, ConnRec, Store } from "./pairing";

// In-memory Store for tests and the local dev stand-in.
export function memoryStore(): Store {
  const codes = new Map<string, CodeRec>();
  const conns = new Map<string, ConnRec>();
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
  };
}
