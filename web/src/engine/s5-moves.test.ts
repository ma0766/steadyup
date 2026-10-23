import { describe, it, expect } from "vitest";
import { createEngine } from "./engine";
import { body, heelRaiseFrames, hide, marchFrames, sideLegRaiseFrames, sitToStandFrames, tandemFrames } from "./fixtures";
import { LM, type EngineEvent, type Frame, type MoveId } from "./types";

// Every fixture is a SYNTHETIC landmark stream (docs/FIXTURES.md). Each move: positive, negative, low-confidence.
const run = (move: MoveId, frames: Frame[], side?: "left" | "right") => {
  const e = createEngine(move, { side });
  const events: EngineEvent[] = [];
  for (const f of frames) events.push(...e.push(f));
  return { count: e.count, events };
};
const cues = (ev: EngineEvent[]) => ev.filter((x) => x.type === "cue").map((x: any) => x.text);
const lowConf = (ev: EngineEvent[]) => ev.some((x) => x.type === "low-confidence");

describe("S5 heel raises", () => {
  it("counts 10 of 10 with jitter", () => expect(run("heel_raise", heelRaiseFrames({ reps: 10, noise: 0.003 })).count).toBe(10));
  it("ignores a lift under 3% of leg length", () => expect(run("heel_raise", heelRaiseFrames({ reps: 10, lift: 0.015, noise: 0.002 })).count).toBe(0));
  it("counts 0 and says so when the heels are out of view", () => {
    const r = run("heel_raise", hide(heelRaiseFrames({ reps: 5 }), [LM.L_HEEL, LM.R_HEEL]));
    expect(r.count).toBe(0); expect(lowConf(r.events)).toBe(true);
  });
  it("says 'Stand tall' only when the torso leans over 15 degrees", () => {
    expect(cues(run("heel_raise", heelRaiseFrames({ reps: 4, leanDeg: 22 })).events)).toContain("Stand tall");
    expect(cues(run("heel_raise", heelRaiseFrames({ reps: 4, leanDeg: 5 })).events)).toHaveLength(0);
  });
  it("keeps counting after the person steps back (heels sit lower in the picture)", () => {
    const near = heelRaiseFrames({ reps: 3, noise: 0.002 });
    const far = heelRaiseFrames({ reps: 5, scale: 0.6, noise: 0.002 }).map((f) => ({ ...f, t: f.t + 20_000 }));
    const n = run("heel_raise", [...near, ...far]).count;
    expect(n).toBeGreaterThanOrEqual(6); // loses the reps that overlap the 4 s re-learn of the floor
    expect(n).toBeLessThanOrEqual(8);
  });
  it("works at a different distance from the camera", () =>
    expect(run("heel_raise", heelRaiseFrames({ reps: 6, scale: 0.6, noise: 0.002 })).count).toBe(6));
});

describe("S5 side leg raise", () => {
  for (const side of ["left", "right"] as const) {
    it(`counts 8 of 8 on the ${side} side`, () =>
      expect(run("side_leg_raise", sideLegRaiseFrames({ reps: 8, side, noise: 0.003 }), side).count).toBe(8));
  }
  it("ignores the other leg moving", () =>
    expect(run("side_leg_raise", sideLegRaiseFrames({ reps: 6, side: "right" }), "left").count).toBe(0));
  it("ignores a lift under 20 degrees", () =>
    expect(run("side_leg_raise", sideLegRaiseFrames({ reps: 6, side: "left", angleDeg: 12 }), "left").count).toBe(0));
  it("counts 0 and says so when the legs are out of view", () => {
    const r = run("side_leg_raise", hide(sideLegRaiseFrames({ reps: 4, side: "left" }), [LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE]), "left");
    expect(r.count).toBe(0); expect(lowConf(r.events)).toBe(true);
  });
  it("says 'Keep your body still' only when the torso tilts over 12 degrees", () => {
    expect(cues(run("side_leg_raise", sideLegRaiseFrames({ reps: 4, side: "left", leanDeg: 20 }), "left").events)).toContain("Keep your body still");
    expect(cues(run("side_leg_raise", sideLegRaiseFrames({ reps: 4, side: "left", leanDeg: 3 }), "left").events)).toHaveLength(0);
  });
});

describe("S5 marching in place", () => {
  it("counts 12 alternating knee lifts as 12 reps", () => expect(run("march", marchFrames({ lifts: 12, noise: 0.003 })).count).toBe(12));
  it("counts the same knee twice in a row only once", () => expect(run("march", marchFrames({ lifts: 6, onlyLeft: true })).count).toBe(1));
  it("counts 0 and says so when the legs are out of view", () => {
    const r = run("march", hide(marchFrames({ lifts: 6 }), [LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE]));
    expect(r.count).toBe(0); expect(lowConf(r.events)).toBe(true);
  });
  it("says 'Hold the chair' when the wrists leave chair height, not otherwise", () => {
    expect(cues(run("march", marchFrames({ lifts: 6, wristsOff: true })).events)).toContain("Hold the chair");
    expect(cues(run("march", marchFrames({ lifts: 6 })).events)).toHaveLength(0);
  });
});

describe("S5 tandem stance hold", () => {
  const holds = (ev: EngineEvent[]) => ev.filter((e) => e.type === "hold").map((e: any) => e.seconds);
  it("times 20 seconds with feet in line", () => {
    const r = run("tandem_hold", tandemFrames({ seconds: 20, noise: 0.002 }));
    expect(r.count).toBe(20);
    expect(holds(r.events).slice(0, 3)).toEqual([1, 2, 3]);
  });
  it("does not run the timer when the feet are apart", () => expect(run("tandem_hold", tandemFrames({ seconds: 15, inLine: false })).count).toBe(0));
  it("counts 0 when the body is out of view", () => {
    const r = run("tandem_hold", hide(tandemFrames({ seconds: 10 }), [LM.L_ANKLE, LM.R_ANKLE]));
    expect(r.count).toBe(0); expect(lowConf(r.events)).toBe(true);
  });
  it("says 'Hold the chair, that's fine' on big sway, and stays quiet when steady", () => {
    expect(cues(run("tandem_hold", tandemFrames({ seconds: 8, sway: 0.25 })).events)).toContain("Hold the chair, that's fine");
    expect(cues(run("tandem_hold", tandemFrames({ seconds: 8, sway: 0.01, noise: 0.002 })).events)).toHaveLength(0);
  });
});

describe("S5 whole plan", () => {
  it("every default-plan set can be completed from its own fixture", () => {
    const plan: { move: MoveId; side?: "left" | "right"; target: number }[] = [
      { move: "sit_to_stand", target: 8 }, { move: "heel_raise", target: 10 },
      { move: "side_leg_raise", side: "left", target: 8 }, { move: "side_leg_raise", side: "right", target: 8 },
      { move: "march", target: 12 }, { move: "tandem_hold", target: 20 },
    ];
    for (const p of plan) {
      const frames =
        p.move === "sit_to_stand" ? sitToStandFrames({ reps: p.target, noise: 0.003 })
        : p.move === "heel_raise" ? heelRaiseFrames({ reps: p.target, noise: 0.003 })
        : p.move === "side_leg_raise" ? sideLegRaiseFrames({ reps: p.target, side: p.side!, noise: 0.003 })
        : p.move === "march" ? marchFrames({ lifts: p.target, noise: 0.003 })
        : tandemFrames({ seconds: p.target, noise: 0.003 });
      expect(run(p.move, frames, p.side).count, `${p.move} ${p.side ?? ""}`).toBe(p.target);
    }
  });
  it("body() keeps all 33 landmarks and a sane torso", () => {
    const lm = body({});
    expect(lm).toHaveLength(33);
    expect(lm[LM.L_SHOULDER].y).toBeLessThan(lm[LM.L_HIP].y);
  });
});

describe("S5 robustness", () => {
  it("counts exactly across 15 different jitter patterns for every move", () => {
    for (let seed = 1; seed <= 15; seed++) {
      const n = { noise: 0.004, seed };
      expect(run("sit_to_stand", sitToStandFrames({ reps: 8, ...n })).count, `sit seed ${seed}`).toBe(8);
      expect(run("heel_raise", heelRaiseFrames({ reps: 10, ...n })).count, `heel seed ${seed}`).toBe(10);
      expect(run("side_leg_raise", sideLegRaiseFrames({ reps: 8, side: "left", ...n }), "left").count, `side seed ${seed}`).toBe(8);
      expect(run("march", marchFrames({ lifts: 12, ...n })).count, `march seed ${seed}`).toBe(12);
      expect(run("tandem_hold", tandemFrames({ seconds: 20, ...n })).count, `tandem seed ${seed}`).toBe(20);
    }
  });
});
