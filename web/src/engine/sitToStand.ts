import { type EngineEvent, type Landmark, LM } from "./types";
import { hipHeight, kneeInward } from "./geometry";
import { SIT_TO_STAND as T } from "./thresholds";
import type { MoveLogic } from "./engine";

// State machine: UNKNOWN -> SEATED -> (rise) -> STANDING -> (back down) -> SEATED  = 1 rep.
// Two bands with a gap between them (hysteresis): crossing back and forth inside the gap changes nothing.
type S = "unknown" | "seated" | "standing";

export function sitToStand(): MoveLogic {
  let state: S = "unknown";
  let armed = false;       // true once we were seated and then reached the standing band
  let count = 0;
  let caved = false;       // knees caved during this rep
  let cueSent = false;

  return {
    id: "sit_to_stand",
    needed: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE],
    get count() { return count; },
    reset() { state = "unknown"; armed = false; count = 0; caved = false; cueSent = false; },
    step(lm: Landmark[], _t: number, out: EngineEvent[]) {
      const h = hipHeight(lm);
      if (!Number.isFinite(h)) return;

      // form check only while moving between the bands (knees cave on the way up or down)
      if (h > T.seatedBelow && h < T.standingAbove + 0.2 && !cueSent) {
        const inward = Math.max(kneeInward(lm, "left"), kneeInward(lm, "right"));
        if (inward > T.kneeInward) caved = true;
        if (caved) { out.push({ type: "cue", move: "sit_to_stand", text: "Keep knees over toes" }); cueSent = true; }
      }

      if (h <= T.seatedBelow) {
        if (state === "standing" && armed) {
          count++; armed = false;
          out.push({ type: "rep", move: "sit_to_stand", count });
          caved = false; cueSent = false; // new rep, fresh form check
        }
        state = "seated";
      } else if (h >= T.standingAbove) {
        if (state === "seated") armed = true;
        state = "standing";
      }
    },
  };
}
