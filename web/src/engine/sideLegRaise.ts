import { type EngineEvent, type Landmark, LM } from "./types";
import { mid, torsoTiltDeg } from "./geometry";
import { SIDE_LEG as T } from "./thresholds";
import type { MoveLogic } from "./engine";

// Hip abduction angle of one leg (hip -> ankle against straight down): over 20 degrees, then back under 8 = 1 rep.
// Only the chosen side counts; the other leg moving does nothing.
export function sideLegRaise(side: "left" | "right"): MoveLogic {
  const hipI = side === "left" ? LM.L_HIP : LM.R_HIP;
  const ankI = side === "left" ? LM.L_ANKLE : LM.R_ANKLE;
  let up = false, count = 0, cueSent = false;
  return {
    id: "side_leg_raise",
    needed: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE],
    get count() { return count; },
    reset() { up = false; count = 0; cueSent = false; },
    step(lm: Landmark[], _t: number, out: EngineEvent[]) {
      const hip = lm[hipI], ank = lm[ankI];
      const midX = mid(lm[LM.L_HIP], lm[LM.R_HIP]).x;
      const outward = Math.sign(hip.x - midX) * (ank.x - hip.x); // positive = leg moved away from the body (not across it)
      const deg = (Math.atan2(Math.max(outward, 0), Math.max(ank.y - hip.y, 1e-6)) * 180) / Math.PI;
      if (!up) { if (deg > T.upDeg) up = true; }
      else {
        if (!cueSent && torsoTiltDeg(lm) > T.tiltDeg) { out.push({ type: "cue", move: "side_leg_raise", text: "Keep your body still" }); cueSent = true; }
        if (deg < T.downDeg) { up = false; count++; cueSent = false; out.push({ type: "rep", move: "side_leg_raise", count, side }); }
      }
    },
  };
}
