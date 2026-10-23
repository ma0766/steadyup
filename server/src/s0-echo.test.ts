import { describe, it, expect } from "vitest";
import { route } from "./handler";

describe("S0 relay echo", () => {
  it("echoes a default-route message back to the sender", async () => {
    const sent: string[] = [];
    const res = await route("$default", "hello", async (t) => void sent.push(t));
    expect(res.statusCode).toBe(200);
    expect(sent).toEqual(["hello"]);
  });
  it("stays quiet on connect", async () => {
    const sent: string[] = [];
    await route("$connect", undefined, async (t) => void sent.push(t));
    expect(sent).toEqual([]);
  });
});
