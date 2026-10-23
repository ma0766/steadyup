import { describe, it, expect } from "vitest";
import { createEngine } from "./engine";
import { bandsOrDefault, createCalibrator } from "./calibration";
import { emptyFrames, pose, sitToStandFrames } from "./fixtures";
import type { Frame } from "./types";

// SYNTHETIC bodies: 3 builds (hip height seated/standing, in torso lengths) x 3 camera distances (scale).
const BUILDS = [
  { name: "short legs", seatedH: 0.9, standH: 1.45 },
  { name: "average", seatedH: 1.0, standH: 1.8 },
  { name: "long legs", seatedH: 1.2, standH: 2.2 },
];
const DISTANCES = [0.5, 0.8, 1.2];

const calibrate = (frames: Frame[]) => { const c = createCalibrator(); frames.forEach((f) => c.push(f)); return c.result(); };
const count = (frames: Frame[], bands?: { seatedBelow: number; standingAbove: number }) => {
  const e = createEngine("sit_to_stand", { bands }); frames.forEach((f) => e.push(f)); return e.count;
};
const slow = (o: object) => sitToStandFrames({ reps: 2, moveMs: 2200, holdMs: 900, noise: 0.003, ...o });

describe("S5b personal calibration (synthetic bodies)", () => {
  for (const b of BUILDS) for (const scale of DISTANCES) {
    it(`${b.name} at distance ${scale}: calibrates from 2 slow reps, then counts 10 of 10`, () => {
      const r = calibrate(slow({ seatedH: b.seatedH, standH: b.standH, scale }));
      expect(r.status).toBe("done");
      if (r.status !== "done") return;
      expect(r.seated).toBeCloseTo(b.seatedH, 0);
      expect(r.standing).toBeGreaterThan(b.standH - 0.15);
      const set = sitToStandFrames({ reps: 10, seatedH: b.seatedH, standH: b.standH, scale, noise: 0.003 });
      expect(count(set, r.bands)).toBe(10);
    });
  }

  it("the defaults would miss a short-legged person; calibration fixes it", () => {
    const set = sitToStandFrames({ reps: 10, seatedH: 0.9, standH: 1.45, noise: 0.003 });
    expect(count(set)).toBe(0); // 1.45 never reaches the default standing band of 1.5
    const r = calibrate(slow({ seatedH: 0.9, standH: 1.45 }));
    expect(count(set, bandsOrDefault(r))).toBe(10);
  });

  it("is unclear when the person barely moves, and when nobody is in view", () => {
    const still: Frame[] = Array.from({ length: 150 }, (_, i) => ({ t: i * 33, lm: pose(1.0, 0) }));
    expect(calibrate(still)).toMatchObject({ status: "unclear", reason: "not-enough-movement" });
    expect(calibrate(emptyFrames(5000))).toMatchObject({ status: "unclear", reason: "not-in-view" });
  });

  it("is unclear after only one slow stand (needs 2), and falls back to the defaults", () => {
    const one = calibrate(sitToStandFrames({ reps: 1, moveMs: 2200, holdMs: 900 }));
    expect(one).toMatchObject({ status: "unclear", reason: "not-enough-cycles", cycles: 1 });
    expect(bandsOrDefault(one)).toEqual({ seatedBelow: 1.2, standingAbove: 1.5 });
  });

  it("reports progress while the person does the two stands", () => {
    const c = createCalibrator();
    const frames = slow({});
    let seen = 0;
    for (const f of frames) { c.push(f); seen = Math.max(seen, c.progress()); }
    expect(seen).toBe(2);
  });

  it("a calibration that went wrong still leaves counting usable (retry then defaults)", () => {
    const c = createCalibrator();
    emptyFrames(2000).forEach((f) => c.push(f));
    expect(c.result().status).toBe("unclear");
    c.reset();
    slow({}).forEach((f) => c.push(f));
    expect(c.result().status).toBe("done");
  });
});
