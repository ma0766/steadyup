import { describe, it, expect } from "vitest";
import { handle, type Deps } from "./pairing";
import { memoryStore } from "./memory-store";

const mk = (sent: string[]): Deps => ({
  store: memoryStore(), now: Date.now, genCode: () => "000000",
  send: async (_id, t) => { sent.push(t); return true; },
});

describe("S0 relay echo", () => {
  it("echoes a default-route message back to the sender", async () => {
    const sent: string[] = [];
    await handle("$default", "c1", "hello", mk(sent));
    expect(sent).toEqual(["hello"]);
  });
  it("stays quiet on connect", async () => {
    const sent: string[] = [];
    await handle("$connect", "c1", undefined, mk(sent));
    expect(sent).toEqual([]);
  });
});
