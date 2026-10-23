import { type EngineEvent, type Landmark, LM } from "./types";
import { mid, dist, torsoTiltDeg } from "./geometry";
import { HEEL_RAISE as T } from "./thresholds";
import type { MoveLogic } from "./engine";

// Heels rise above a baseline by > 3% of leg length, then return = 1 rep. Baseline follows the floor slowly while heels are down.
export function heelRaise(): MoveLogic {
  let baseline: number | null = null;
  let raised = false, count = 0, cueSent = false, raisedSince = 0;
  return {
    id: "heel_raise",
    needed: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE, LM.L_HEEL, LM.R_HEEL],
    get count() { return count; },
    reset() { baseline = null; raised = false; count = 0; cueSent = false; raisedSince = 0; },
    step(lm: Landmark[], t: number, out: EngineEvent[]) {
      const heelY = (lm[LM.L_HEEL].y + lm[LM.R_HEEL].y) / 2;
      const leg = dist(mid(lm[LM.L_HIP], lm[LM.R_HIP]), mid(lm[LM.L_ANKLE], lm[LM.R_ANKLE]));
      if (baseline === null) baseline = heelY;
      const rise = baseline - heelY; // image y grows downward, so a higher heel has a smaller y
      if (!raised) {
        if (rise > T.raiseFrac * leg) { raised = true; raisedSince = t; }
        else baseline += 0.1 * (heelY - baseline); // heels down: follow the floor, even after the person steps back
      } else if (t - raisedSince > T.stuckMs) {
        // heels 'up' for far longer than any heel raise (> 4 s): the person moved (stepped back). Re-learn the floor; no rep.
        baseline = heelY; raised = false; cueSent = false;
      } else {
        if (!cueSent && torsoTiltDeg(lm) > T.leanDeg) { out.push({ type: "cue", move: "heel_raise", text: "Stand tall" }); cueSent = true; }
        if (rise < T.releaseFrac * leg) {
          raised = false; count++; cueSent = false;
          out.push({ type: "rep", move: "heel_raise", count });
        }
      }
    },
  };
}
