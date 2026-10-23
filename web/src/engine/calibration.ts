import { type Frame, type Landmark, MIN_VISIBILITY, LM } from "./types";
import { hipHeight } from "./geometry";
import { DEFAULT_BANDS, SMOOTHING_ALPHA, type StandBands } from "./thresholds";

// Personal calibration: the person does 2 slow sit-to-stands. We learn THEIR seated and standing hip heights
// (in torso lengths) and put the counting bands in between. Unclear movement = ask again; after a few tries, use the defaults.
export type CalibrationResult =
  | { status: "done"; seated: number; standing: number; bands: StandBands; cycles: number }
  | { status: "unclear"; cycles: number; reason: "not-enough-movement" | "not-enough-cycles" | "not-in-view" };

export const CAL = {
  cyclesNeeded: 2,
  minRange: 0.35,        // standing - seated, in torso lengths. Less = they barely moved (or we cannot see well)
  seatedBandShare: 0.28, // seated band: up to 28% of the way from their seated level to their standing level
  standingBandShare: 0.62,
};

export function createCalibrator(alpha = SMOOTHING_ALPHA) {
  const hs: number[] = [];
  let prev: Landmark[] | null = null;
  const needed = [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_ANKLE, LM.R_ANKLE];

  const stats = () => {
    const s = [...hs].sort((a, b) => a - b);
    const take = Math.max(3, Math.floor(s.length * 0.12));
    const seated = s.slice(0, take).reduce((a, b) => a + b, 0) / take;      // mean of the lowest 12% of samples
    const standing = s.slice(-take).reduce((a, b) => a + b, 0) / take;      // mean of the highest 12%
    return { seated, standing };
  };

  /** Complete up/down swings, using a gap between two levels so jitter in the middle cannot add cycles. */
  const cyclesOf = (seated: number, standing: number) => {
    const lo = seated + CAL.seatedBandShare * (standing - seated), hi = seated + CAL.standingBandShare * (standing - seated);
    let state: "unknown" | "low" | "high" = "unknown", cycles = 0, armed = false;
    for (const h of hs) {
      if (h <= lo) { if (state === "high" && armed) { cycles++; armed = false; } state = "low"; }
      else if (h >= hi) { if (state === "low") armed = true; state = "high"; }
    }
    return cycles;
  };

  return {
    push(frame: Frame) {
      const lm = frame.lm;
      if (!lm || lm.length < 33 || !needed.every((i) => lm[i].visibility >= MIN_VISIBILITY)) { prev = null; return; }
      const sm = prev ? lm.map((p, i) => ({ x: prev![i].x + alpha * (p.x - prev![i].x), y: prev![i].y + alpha * (p.y - prev![i].y), visibility: p.visibility })) : lm.map((p) => ({ ...p }));
      prev = sm;
      const h = hipHeight(sm);
      if (Number.isFinite(h)) hs.push(h);
    },
    /** Cycles seen so far (for a progress hint on the TV). */
    progress(): number {
      if (hs.length < 10) return 0;
      const { seated, standing } = stats();
      return standing - seated < CAL.minRange ? 0 : Math.min(cyclesOf(seated, standing), CAL.cyclesNeeded);
    },
    result(): CalibrationResult {
      if (hs.length < 30) return { status: "unclear", cycles: 0, reason: "not-in-view" };
      const { seated, standing } = stats();
      if (standing - seated < CAL.minRange) return { status: "unclear", cycles: 0, reason: "not-enough-movement" };
      const cycles = cyclesOf(seated, standing);
      if (cycles < CAL.cyclesNeeded) return { status: "unclear", cycles, reason: "not-enough-cycles" };
      const range = standing - seated;
      return {
        status: "done", seated, standing, cycles,
        bands: { seatedBelow: seated + CAL.seatedBandShare * range, standingAbove: seated + CAL.standingBandShare * range },
      };
    },
    reset() { hs.length = 0; prev = null; },
  };
}

/** After this many unclear tries we stop asking and use the defaults, so the session is never blocked. */
export const MAX_CALIBRATION_TRIES = 3;
export const bandsOrDefault = (r: CalibrationResult): StandBands => (r.status === "done" ? r.bands : DEFAULT_BANDS);
