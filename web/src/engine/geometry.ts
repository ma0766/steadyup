import { type Landmark, LM } from "./types";

export const mid = (a: Landmark, b: Landmark) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** Torso length = mid-shoulder to mid-hip. Every distance is divided by it so the count does not depend on how far the phone is. */
export function torsoLength(lm: Landmark[]): number {
  return dist(mid(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]), mid(lm[LM.L_HIP], lm[LM.R_HIP]));
}

/** Image y grows downward, so "height above ankles" is ankleY - hipY, in torso lengths. */
export function hipHeight(lm: Landmark[]): number {
  const t = torsoLength(lm);
  if (t < 1e-6) return NaN;
  const hip = mid(lm[LM.L_HIP], lm[LM.R_HIP]);
  const ankle = mid(lm[LM.L_ANKLE], lm[LM.R_ANKLE]);
  return (ankle.y - hip.y) / t;
}

/** How far a knee sits toward the body midline compared with its ankle, in torso lengths. Positive = caved in. */
export function kneeInward(lm: Landmark[], side: "left" | "right"): number {
  const midX = mid(lm[LM.L_HIP], lm[LM.R_HIP]).x;
  const knee = lm[side === "left" ? LM.L_KNEE : LM.R_KNEE];
  const ankle = lm[side === "left" ? LM.L_ANKLE : LM.R_ANKLE];
  return (Math.abs(ankle.x - midX) - Math.abs(knee.x - midX)) / torsoLength(lm);
}
