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

// ---------------------------------------------------------------------------------------------------------------
// S5: other moves. One flexible body builder + a time function per move. All SYNTHETIC.
// ---------------------------------------------------------------------------------------------------------------
export type BodySpec = {
  heelLift?: number;                          // fraction of leg length
  legAngle?: { left?: number; right?: number }; // hip abduction in degrees
  kneeLift?: { left?: number; right?: number }; // 0..1, 1 = knee well above mid-thigh
  leanDeg?: number;                           // shoulders shift sideways: torso tilt in degrees
  ankleGap?: number;                          // 0 = feet in a line (tandem), 1 = normal stance
  sway?: number;                              // sideways body shift in torso lengths
  wristsOff?: boolean;                        // hands left the chair
};
export type CommonOpts = { noise?: number; seed?: number; scale?: number; visibility?: number; fps?: number };

const rad = (d: number) => (d * Math.PI) / 180;

export function body(spec: BodySpec, o: CommonOpts & { jitter?: () => number } = {}): Landmark[] {
  const sc = o.scale ?? 1, vis = o.visibility ?? 0.99, j = o.jitter ?? (() => 0);
  const T = TORSO * sc, cx = 0.5, h = 1.8;
  const ankleY0 = 0.5 + 2.4 * T * 0.5 + 0.1;
  const hipY = ankleY0 - h * T, L = h * T;
  const sway = (spec.sway ?? 0) * T;
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: cx, y: hipY - T, visibility: vis }));
  const set = (i: number, x: number, y: number) => (lm[i] = { x: x + j(), y: y + j(), visibility: vis });
  const lean = Math.tan(rad(spec.leanDeg ?? 0)) * T;
  const top = sway + lean; // upper body shift
  set(LM.NOSE, cx + top, hipY - T - 0.45 * T);
  set(LM.L_SHOULDER, cx - 0.42 * T + top, hipY - T); set(LM.R_SHOULDER, cx + 0.42 * T + top, hipY - T);
  set(LM.L_ELBOW, cx - 0.55 * T + top, hipY - 0.45 * T); set(LM.R_ELBOW, cx + 0.55 * T + top, hipY - 0.45 * T);
  const wristY = spec.wristsOff ? hipY - 0.7 * T : hipY + 0.1 * T;
  set(LM.L_WRIST, cx - 0.6 * T + sway, wristY); set(LM.R_WRIST, cx + 0.6 * T + sway, wristY);
  for (const [sd, side] of [[-1, "left"], [1, "right"]] as const) {
    const I = side === "left" ? { hip: LM.L_HIP, knee: LM.L_KNEE, ankle: LM.L_ANKLE, heel: LM.L_HEEL, foot: LM.L_FOOT }
                              : { hip: LM.R_HIP, knee: LM.R_KNEE, ankle: LM.R_ANKLE, heel: LM.R_HEEL, foot: LM.R_FOOT };
    const hx = cx + sd * 0.28 * T + sway;
    const a = rad(spec.legAngle?.[side] ?? 0), k = spec.kneeLift?.[side] ?? 0, g = spec.ankleGap ?? 1;
    // ankle: straight down from the hip, swung out by the abduction angle, pulled in for tandem, raised by a knee lift
    const ax = cx + sd * (0.03 + g * 0.33) * T + sd * Math.sin(a) * L; // feet stay planted when the body sways: 0.36 T at g = 1
    let ay = hipY + Math.cos(a) * L;
    ay -= k * 0.4 * L;
    const lift = (spec.heelLift ?? 0) * L;
    const kneeRestY = hipY + 0.55 * (ankleY0 - hipY);
    const kneeY = kneeRestY + (hipY + 0.25 * T - kneeRestY) * k;
    const kx = hx + (ax - hx) * 0.55;
    set(I.hip, hx, hipY);
    set(I.knee, kx, a > 0 ? hipY + (ay - hipY) * 0.55 : kneeY);
    set(I.ankle, ax, ay - lift * 0.8);
    set(I.heel, ax, ay + 0.02 * T - lift);
    set(I.foot, ax + sd * 0.04 * T, ay + 0.06 * T - lift * 0.9);
  }
  return lm;
}

/** Trapezoid 0..1..0: rise, hold, fall, rest. Repeats every period. */
function wave(tMs: number, startMs: number, riseMs: number, holdMs: number, fallMs: number, restMs: number): number {
  const period = riseMs + holdMs + fallMs + restMs;
  if (tMs < startMs) return 0;
  const t = (tMs - startMs) % period;
  if (t < riseMs) return ease(t / riseMs);
  if (t < riseMs + holdMs) return 1;
  if (t < riseMs + holdMs + fallMs) return 1 - ease((t - riseMs - holdMs) / fallMs);
  return 0;
}

function render(totalMs: number, spec: (tMs: number) => BodySpec, o: CommonOpts): Frame[] {
  const fps = o.fps ?? 30, dt = 1000 / fps, r = rng(o.seed ?? 7);
  const jitter = o.noise ? () => (r() + r() + r() - 1.5) * (o.noise! * 0.8) : undefined;
  const frames: Frame[] = [];
  for (let t = 0; t < totalMs; t += dt) frames.push({ t, lm: body(spec(t), { ...o, jitter }) });
  return frames;
}

const LEAD = 600; // quiet standing at the start so baselines settle

export type HeelOpts = CommonOpts & { reps: number; lift?: number; leanDeg?: number };
export function heelRaiseFrames(o: HeelOpts): Frame[] {
  const lift = o.lift ?? 0.08, P = 2400;
  return render(LEAD + o.reps * P + 400, (t) => {
    const w = wave(t, LEAD, 800, 300, 800, 500);
    return { heelLift: lift * w, leanDeg: (o.leanDeg ?? 0) * w };
  }, o);
}

export type SideOpts = CommonOpts & { reps: number; side: "left" | "right"; angleDeg?: number; leanDeg?: number; otherLegToo?: boolean };
export function sideLegRaiseFrames(o: SideOpts): Frame[] {
  const ang = o.angleDeg ?? 30, P = 2400, other = o.side === "left" ? "right" : "left";
  return render(LEAD + o.reps * P + 400, (t) => {
    const w = wave(t, LEAD, 800, 300, 800, 500);
    return { legAngle: { [o.side]: ang * w, ...(o.otherLegToo ? { [other]: ang * w } : {}) }, leanDeg: (o.leanDeg ?? 0) * w };
  }, o);
}

export type MarchOpts = CommonOpts & { lifts: number; onlyLeft?: boolean; wristsOff?: boolean };
export function marchFrames(o: MarchOpts): Frame[] {
  const P = 800; // one knee lift
  return render(LEAD + o.lifts * P + 100, (t) => {
    const n = Math.floor((t - LEAD) / P);
    const w = t < LEAD ? 0 : wave(t, LEAD, 300, 100, 300, 100);
    const left = o.onlyLeft ? true : n % 2 === 0;
    return { kneeLift: { left: left ? w : 0, right: left ? 0 : w }, wristsOff: o.wristsOff };
  }, o);
}

export type TandemOpts = CommonOpts & { seconds: number; inLine?: boolean; sway?: number };
export function tandemFrames(o: TandemOpts): Frame[] {
  return render(LEAD + o.seconds * 1000, (t) => ({
    ankleGap: o.inLine === false ? 1 : 0,
    sway: (o.sway ?? 0) * Math.sin((2 * Math.PI * t) / 1000),
  }), o);
}

/** Hide some landmark indices (low visibility) in every frame. */
export const hide = (frames: Frame[], indices: number[]): Frame[] =>
  frames.map((f) => ({ t: f.t, lm: f.lm && f.lm.map((l, i) => (indices.includes(i) ? { ...l, visibility: 0.1 } : l)) }));
