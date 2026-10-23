import { type EngineEvent, type Landmark, LM, MIN_VISIBILITY } from "./types";
import { mid, torsoLength } from "./geometry";
import { MARCH as T } from "./thresholds";
import type { MoveLogic } from "./engine";

// A knee rising above the mid-thigh line counts 1 rep, and knees must alternate (same knee twice in a row counts once).
export function march(): MoveLogic {
  const rest = { left: 0, right: 0 };   // standing hip-to-knee drop, learned (it only shrinks when a knee comes toward the camera)
  const up = { left: false, right: false };
  let last: "left" | "right" | null = null;
  let count = 0, offSince: number | null = null, chairCueSent = false;
  return {
    id: "march",
    needed: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE],
    get count() { return count; },
    reset() { rest.left = rest.right = 0; up.left = up.right = false; last = null; count = 0; offSince = null; chairCueSent = false; },
    step(lm: Landmark[], t: number, out: EngineEvent[]) {
      for (const side of ["left", "right"] as const) {
        const hip = lm[side === "left" ? LM.L_HIP : LM.R_HIP], knee = lm[side === "left" ? LM.L_KNEE : LM.R_KNEE];
        const drop = knee.y - hip.y;
        rest[side] = Math.max(rest[side] * 0.999, drop);
        if (!up[side]) {
          if (drop < T.liftLineFrac * rest[side]) {
            up[side] = true;
            if (last !== side) { last = side; count++; out.push({ type: "rep", move: "march", count, side }); }
          }
        } else if (drop > T.releaseFrac * rest[side]) up[side] = false;
      }
      // hands should stay on the chair: wrists far above or below hip height for a moment = reminder
      const w = [lm[LM.L_WRIST], lm[LM.R_WRIST]];
      if (w.every((p) => p.visibility >= MIN_VISIBILITY)) {
        const hipY = mid(lm[LM.L_HIP], lm[LM.R_HIP]).y, tl = torsoLength(lm);
        const off = w.some((p) => p.y < hipY - T.wristAboveHipT * tl || p.y > hipY + T.wristBelowHipT * tl);
        if (off) { offSince ??= t; if (!chairCueSent && t - offSince >= T.offChairMs) { out.push({ type: "cue", move: "march", text: "Hold the chair" }); chairCueSent = true; } }
        else { offSince = null; chairCueSent = false; }
      }
    },
  };
}
