import { describe, it, expect } from "vitest";
import { createEngine } from "./engine";
import { emptyFrames, legsHiddenFrames, pose, sitToStandFrames } from "./fixtures";
import type { EngineEvent, Frame } from "./types";

// All fixtures here are SYNTHETIC landmark streams (see docs/FIXTURES.md).
const run = (frames: Frame[]) => {
  const e = createEngine("sit_to_stand");
  const events: EngineEvent[] = [];
  for (const f of frames) events.push(...e.push(f));
  return { count: e.count, events };
};
const reps = (ev: EngineEvent[]) => ev.filter((x) => x.type === "rep");
const cues = (ev: EngineEvent[]) => ev.filter((x) => x.type === "cue");

describe("S3 sit to stand engine (synthetic fixtures)", () => {
  it("counts exactly 10 of 10 clean reps, with camera jitter", () => {
    const { count, events } = run(sitToStandFrames({ reps: 10, noise: 0.004 }));
    expect(count).toBe(10);
    expect(reps(events).map((r: any) => r.count)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("counts the same when the person is far away (small) or close (big)", () => {
    expect(run(sitToStandFrames({ reps: 10, scale: 0.55, noise: 0.002 })).count).toBe(10);
    expect(run(sitToStandFrames({ reps: 10, scale: 1.3, noise: 0.004 })).count).toBe(10);
  });

  it("starting standing: the first sit down is not a rep; a rep is seated -> standing -> seated", () => {
    // 10 stand/sit cycles that begin and end standing complete 9 full reps (spec: seated band to standing band and back)
    expect(run(sitToStandFrames({ reps: 10, startStanding: true, noise: 0.003 })).count).toBe(9);
  });

  it("counts 0 when nobody is in view, and says so once", () => {
    const { count, events } = run(emptyFrames(20_000));
    expect(count).toBe(0);
    expect(events.filter((e) => e.type === "low-confidence")).toHaveLength(1);
  });

  it("counts 0 when the legs are out of frame, even though the body moves", () => {
    const { count, events } = run(legsHiddenFrames({ reps: 10 }));
    expect(count).toBe(0);
    expect(events.some((e) => e.type === "low-confidence")).toBe(true);
  });

  it("recovers: reps after the person steps back into view still count", () => {
    const frames = [...emptyFrames(2000), ...sitToStandFrames({ reps: 3 })].map((f, i) => ({ ...f, t: i * 33 }));
    const { count, events } = run(frames);
    expect(count).toBe(3);
    expect(events.some((e) => e.type === "back-in-view")).toBe(true);
  });

  it("does not double count when hips hover between the bands", () => {
    const hover: Frame[] = [];
    for (let i = 0; i < 300; i++) hover.push({ t: i * 33, lm: pose(1.2 + 0.28 * (i % 2), 0) }); // flickers inside the gap
    expect(run(hover).count).toBe(0);
  });

  it("does not count a half rise that never reaches the standing band", () => {
    const half = sitToStandFrames({ reps: 5, standH: 1.4 });
    expect(run(half).count).toBe(0);
  });

  it("fires the knee cue when knees cave, and not on a clean fixture", () => {
    const bad = run(sitToStandFrames({ reps: 6, cave: 0.2, noise: 0.002 }));
    expect(cues(bad.events).length).toBeGreaterThanOrEqual(1);
    expect((cues(bad.events)[0] as any).text).toBe("Keep knees over toes");
    expect(bad.count).toBe(6); // form feedback never blocks counting

    const clean = run(sitToStandFrames({ reps: 6, cave: 0, noise: 0.004 }));
    expect(cues(clean.events)).toHaveLength(0);
  });

  it("gives at most one cue per rep", () => {
    const bad = run(sitToStandFrames({ reps: 4, cave: 0.25 }));
    expect(cues(bad.events).length).toBeLessThanOrEqual(4);
  });

  it("reset clears the count", () => {
    const e = createEngine("sit_to_stand");
    for (const f of sitToStandFrames({ reps: 2 })) e.push(f);
    expect(e.count).toBe(2);
    e.reset();
    expect(e.count).toBe(0);
  });

  it("is deterministic: same fixture, same result", () => {
    const a = sitToStandFrames({ reps: 3, noise: 0.004, seed: 11 });
    const b = sitToStandFrames({ reps: 3, noise: 0.004, seed: 11 });
    expect(a).toEqual(b);
  });
});
