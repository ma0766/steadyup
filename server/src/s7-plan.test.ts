import { describe, it, expect } from "vitest";
import { buildPrompt, capTarget, DEFAULT_TARGETS, isPlain, LIMITS, makePlan, type Targets } from "./plan";
import { route } from "./api";
import { memoryStore } from "./memory-store";
import type { SetRec } from "./summary";

const HOME = "c".repeat(32);
const week: SetRec[] = Array.from({ length: 7 }, (_, i) => ({
  session: `s${i}`, idx: 0, move: "sit_to_stand", target: 8, done: 8, cues: 0, day: `2026-10-${16 + i}`, ts: 1_800_000_000_000 + i,
}));
// a mock model: answers whatever the test wants, as text, like the real one would
const says = (o: unknown) => async () => (typeof o === "string" ? o : JSON.stringify(o));
const ask = (next: Record<string, number>, sentence?: string) => ({ moves: Object.entries(next).map(([key, n]) => ({ key, next: n, ...(sentence ? { sentence } : {}) })) });

describe("S7 plan caps are enforced in code", () => {
  it("holds even when the model asks for +10 reps", async () => {
    const plan = await makePlan(week, DEFAULT_TARGETS, says(ask({ sit_to_stand: 18, heel_raise: 20, march: 22 })));
    expect(plan.source).toBe("model");
    expect(plan.targets.sit_to_stand).toBe(10);   // 8 + 2
    expect(plan.targets.heel_raise).toBe(12);     // 10 + 2
    expect(plan.targets.march).toBe(14);          // 12 + 2
  });
  it("holds for seconds: +10 s becomes +5 s, and never above 30 s", async () => {
    const a = await makePlan([], { ...DEFAULT_TARGETS }, says(ask({ tandem_hold: 30 })));
    expect(a.targets.tandem_hold).toBe(25);
    const b = await makePlan([], { ...DEFAULT_TARGETS, tandem_hold: 28 }, says(ask({ tandem_hold: 99 })));
    expect(b.targets.tandem_hold).toBe(30);
  });
  it("never goes above 15 reps", async () => {
    const plan = await makePlan([], { ...DEFAULT_TARGETS, sit_to_stand: 14 }, says(ask({ sit_to_stand: 40 })));
    expect(plan.targets.sit_to_stand).toBe(15);
    const again = await makePlan([], plan.targets, says(ask({ sit_to_stand: 40 })));
    expect(again.targets.sit_to_stand).toBe(15);
  });
  it("lowers by at most 2 reps and keeps a floor", async () => {
    const plan = await makePlan([], DEFAULT_TARGETS, says(ask({ sit_to_stand: 0, heel_raise: -50 })));
    expect(plan.targets.sit_to_stand).toBe(6);
    expect(plan.targets.heel_raise).toBe(8);
    expect(capTarget("sit_to_stand", 4, 0)).toBe(4);
    expect(capTarget("tandem_hold", 10, 0)).toBe(10);
  });
  it("capTarget never exceeds its step or ceiling for any request", () => {
    for (const key of ["sit_to_stand", "heel_raise", "march", "side_leg_raise@left", "tandem_hold"]) {
      const hold = key === "tandem_hold";
      for (let cur = hold ? 10 : 4; cur <= (hold ? 30 : 15); cur++) for (const ask of [-1000, -3, 0, 5, 1000, NaN]) {
        const out = capTarget(key, cur, ask);
        expect(Math.abs(out - cur)).toBeLessThanOrEqual(hold ? LIMITS.stepHold : LIMITS.stepReps);
        expect(out).toBeLessThanOrEqual(hold ? LIMITS.maxHold : LIMITS.maxReps);
      }
    }
  });
  it("ignores unknown moves the model invents", async () => {
    const plan = await makePlan(week, DEFAULT_TARGETS, says(ask({ jumping_jacks: 50, sit_to_stand: 9 })));
    expect(Object.keys(plan.targets).sort()).toEqual(Object.keys(DEFAULT_TARGETS).sort());
    expect(plan.targets.sit_to_stand).toBe(9);
  });
});

describe("S7 failure keeps the current plan", () => {
  const same = (p: { targets: Targets; source: string; changes: unknown[] }) => {
    expect(p.targets).toEqual(DEFAULT_TARGETS); expect(p.source).toBe("kept"); expect(p.changes).toEqual([]);
  };
  it("model throws", async () => same(await makePlan(week, DEFAULT_TARGETS, async () => { throw new Error("Bedrock down"); })));
  it("model replies with prose", async () => same(await makePlan(week, DEFAULT_TARGETS, says("Sure! Try more reps."))));
  it("model replies with the wrong shape", async () => same(await makePlan(week, DEFAULT_TARGETS, says({ moves: [{ key: "march", next: "lots" }] }))));
  it("model wraps valid JSON in prose and still works", async () => {
    const p = await makePlan(week, DEFAULT_TARGETS, says("Here you go:\n" + JSON.stringify(ask({ sit_to_stand: 10 })) + "\nGood luck!"));
    expect(p.source).toBe("model"); expect(p.targets.sit_to_stand).toBe(10);
  });
});

describe("S7 one plain sentence per change", () => {
  it("keeps a plain model sentence", async () => {
    const p = await makePlan(week, DEFAULT_TARGETS, says(ask({ sit_to_stand: 10 }, "You did 8 every day. Let's try 10.")));
    expect(p.changes.find((c) => c.key === "sit_to_stand")!.sentence).toBe("You did 8 every day. Let's try 10.");
  });
  it("replaces a long or techy sentence with a plain one written by code", async () => {
    const p = await makePlan(week, DEFAULT_TARGETS, says(ask({ sit_to_stand: 10 }, "Based on the model API output the algorithm recommends increasing repetitions substantially now.")));
    expect(p.changes.find((c) => c.key === "sit_to_stand")!.sentence).toBe("Let's try 10.");
  });
  it("has one sentence for every move, all plain", async () => {
    const p = await makePlan(week, DEFAULT_TARGETS, says(ask({ sit_to_stand: 10, tandem_hold: 15 })));
    expect(p.changes).toHaveLength(Object.keys(DEFAULT_TARGETS).length);
    for (const c of p.changes) expect(isPlain(c.sentence), c.sentence).toBe(true);
    expect(p.changes.find((c) => c.key === "tandem_hold")!.sentence).toBe("Let's ease back to 15 seconds."); // 20 s asked down to 15 s: a decrease of exactly 5
  });
});

describe("S7 weekly cooldown and sentence guard", () => {
  it("repeated refreshes inside a week cannot ratchet past the weekly cap, and do not call the model", async () => {
    const store = memoryStore();
    let calls = 0;
    const greedy = async () => { calls++; return JSON.stringify(ask({ sit_to_stand: 99, heel_raise: 99, march: 99, tandem_hold: 99 })); };
    const t0 = Date.parse("2026-10-23T12:00:00Z");
    for (let i = 0; i < 7; i++) await route("POST", "/plan/refresh", { home: HOME }, undefined, store, t0 + i * 3_600_000, greedy);
    const p = JSON.parse((await route("GET", "/plan", { home: HOME }, undefined, store)).body!);
    expect(calls).toBe(1);
    expect(p.targets.sit_to_stand).toBe(10);          // +2 once, not +14
    expect(p.targets.tandem_hold).toBe(25);
    await route("POST", "/plan/refresh", { home: HOME }, undefined, store, t0 + 8 * 86_400_000, greedy); // next week: one more step
    expect(JSON.parse((await route("GET", "/plan", { home: HOME }, undefined, store)).body!).targets.sit_to_stand).toBe(12);
  });
  it("drops a model sentence that disagrees with the capped number or makes a medical claim", async () => {
    const a = await makePlan(week, DEFAULT_TARGETS, says(ask({ sit_to_stand: 20 }, "Great work. Let's try 20.")));
    expect(a.changes.find((c) => c.key === "sit_to_stand")!.sentence).toBe("Let's try 10.");
    const b = await makePlan(week, DEFAULT_TARGETS, says(ask({ sit_to_stand: 10 }, "This will prevent falls. Let's try 10.")));
    expect(b.changes.find((c) => c.key === "sit_to_stand")!.sentence).toBe("Let's try 10.");
  });
});

describe("S7 prompt", () => {
  it("carries counts only, never body points", () => {
    const prompt = buildPrompt(week, DEFAULT_TARGETS);
    expect(prompt).toContain("sit_to_stand");
    expect(prompt).not.toMatch(/landmark|visibility|"p":/i);
  });
});

describe("S7 API", () => {
  it("refreshes, stores and serves the plan; a failed call stores nothing", async () => {
    const store = memoryStore();
    const ok = await route("POST", "/plan/refresh", { home: HOME }, undefined, store, Date.parse("2026-10-23T12:00:00Z"), says(ask({ sit_to_stand: 18 })));
    expect(JSON.parse(ok.body!).targets.sit_to_stand).toBe(10);
    expect(JSON.parse((await route("GET", "/plan", { home: HOME }, undefined, store)).body!).targets.sit_to_stand).toBe(10);
    const bad = await route("POST", "/plan/refresh", { home: HOME }, undefined, store, Date.parse("2026-11-02T12:00:00Z"), async () => { throw new Error("nope"); });
    expect(JSON.parse(bad.body!)).toMatchObject({ source: "kept" });
    expect(JSON.parse((await route("GET", "/plan", { home: HOME }, undefined, store)).body!).targets.sit_to_stand).toBe(10);
  });
  it("serves the default plan before any refresh and refuses bad ids", async () => {
    const store = memoryStore();
    expect(JSON.parse((await route("GET", "/plan", { home: HOME }, undefined, store)).body!)).toMatchObject({ source: "default", targets: DEFAULT_TARGETS });
    expect((await route("GET", "/plan", { home: "x" }, undefined, store)).statusCode).toBe(400);
  });
});
