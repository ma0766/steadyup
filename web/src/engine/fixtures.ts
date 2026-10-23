// SYNTHETIC landmark streams (no real person). Deterministic: same options + seed = same frames.
// Used because no freely licensed front-view chair-stand video was available (docs/FIXTURES.md).
import { type Frame, type Landmark, LM } from "./types";

export type SitStandOpts = {
  reps: number;
  fps?: number;
  seatedH?: number;     // hip height in torso lengths while seated
  standH?: number;      // ... while standing
  moveMs?: number;      // time to rise or sit
  holdMs?: number;      // pause at each end
  cave?: number;        // knees move inward by this many torso lengths mid-motion
  noise?: number;       // gaussian-ish jitter in image units
  scale?: number;       // person size multiplier (distance from camera)
  visibility?: number;  // landmark visibility (0.99 normal)
  startStanding?: boolean;
  seed?: number;
};

const TORSO = 0.22; // image units at scale 1

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

/** One body pose: hip height h (torso lengths above ankles), knee cave amount c (torso lengths). */
export function pose(h: number, c: number, o: { scale?: number; visibility?: number; jitter?: () => number } = {}): Landmark[] {
  const sc = o.scale ?? 1, vis = o.visibility ?? 0.99, j = o.jitter ?? (() => 0);
  const T = TORSO * sc;
  const cx = 0.5, ankleY = 0.5 + 2.4 * T * 0.5 + 0.1; // feet stay put on the floor
  const hipY = ankleY - h * T;
  const kneeY = hipY + (ankleY - hipY) * 0.55;
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: cx, y: hipY - T, visibility: vis }));
  const set = (i: number, x: number, y: number) => (lm[i] = { x: x + j(), y: y + j(), visibility: vis });
  set(LM.NOSE, cx, hipY - T - 0.45 * T);
  set(LM.L_SHOULDER, cx - 0.42 * T, hipY - T); set(LM.R_SHOULDER, cx + 0.42 * T, hipY - T);
  set(LM.L_HIP, cx - 0.28 * T, hipY); set(LM.R_HIP, cx + 0.28 * T, hipY);
  set(LM.L_KNEE, cx - 0.34 * T + c * T, kneeY); set(LM.R_KNEE, cx + 0.34 * T - c * T, kneeY);
  set(LM.L_ANKLE, cx - 0.36 * T, ankleY); set(LM.R_ANKLE, cx + 0.36 * T, ankleY);
  set(LM.L_HEEL, cx - 0.36 * T, ankleY + 0.02 * T); set(LM.R_HEEL, cx + 0.36 * T, ankleY + 0.02 * T);
  set(LM.L_FOOT, cx - 0.4 * T, ankleY + 0.06 * T); set(LM.R_FOOT, cx + 0.4 * T, ankleY + 0.06 * T);
  set(LM.L_WRIST, cx - 0.6 * T, hipY + 0.1 * T); set(LM.R_WRIST, cx + 0.6 * T, hipY + 0.1 * T);
  set(LM.L_ELBOW, cx - 0.55 * T, hipY - 0.45 * T); set(LM.R_ELBOW, cx + 0.55 * T, hipY - 0.45 * T);
  return lm;
}

const ease = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));

export function sitToStandFrames(o: SitStandOpts): Frame[] {
  const fps = o.fps ?? 30, dt = 1000 / fps;
  const seated = o.seatedH ?? 1.0, stand = o.standH ?? 1.8;
  const move = o.moveMs ?? 1000, hold = o.holdMs ?? 700, cave = o.cave ?? 0;
  const r = rng(o.seed ?? 7);
  const jitter = o.noise ? () => (r() + r() + r() - 1.5) * (o.noise! * 0.8) : undefined;

  // piecewise timeline of [duration, fromH, toH]
  const segs: [number, number, number][] = [];
  const start = o.startStanding ? stand : seated;
  segs.push([hold, start, start]);
  for (let i = 0; i < o.reps; i++) {
    if (o.startStanding) segs.push([move, stand, seated], [hold, seated, seated], [move, seated, stand], [hold, stand, stand]);
    else segs.push([move, seated, stand], [hold, stand, stand], [move, stand, seated], [hold, seated, seated]);
  }
  const frames: Frame[] = [];
  let t = 0;
  for (const [dur, a, b] of segs) {
    const n = Math.round(dur / dt);
    for (let k = 0; k < n; k++, t += dt) {
      const u = k / n, h = a + (b - a) * ease(u);
      const moving = a !== b;
      const c = moving ? cave * Math.sin(Math.PI * u) : 0; // knees cave most mid-motion
      frames.push({ t, lm: pose(h, c, { scale: o.scale, visibility: o.visibility, jitter }) });
    }
  }
  return frames;
}

/** Nobody in view for `ms` milliseconds. */
export const emptyFrames = (ms: number, fps = 30): Frame[] =>
  Array.from({ length: Math.round((ms / 1000) * fps) }, (_, i) => ({ t: (i * 1000) / fps, lm: null }));

/** Hips and shoulders visible but legs hidden (person too close, feet out of frame). */
export function legsHiddenFrames(o: SitStandOpts): Frame[] {
  return sitToStandFrames(o).map((f) => ({
    t: f.t,
    lm: f.lm!.map((l, i) => (i >= LM.L_KNEE ? { ...l, visibility: 0.1 } : l)),
  }));
}
