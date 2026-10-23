import { type EngineEvent, type Landmark, LM } from "./types";
import { hipHeight, kneeInward } from "./geometry";
import { SIT_TO_STAND as T, DEFAULT_BANDS, type StandBands } from "./thresholds";
import type { MoveLogic } from "./engine";

// State machine: UNKNOWN -> SEATED -> (rise) -> STANDING -> (back down) -> SEATED  = 1 rep.
// Two bands with a gap between them (hysteresis): crossing back and forth inside the gap changes nothing.
type S = "unknown" | "seated" | "standing";

/**
 * bands: this person's own seated/standing levels (from calibration), or the defaults.
 * countOn: "return" = a rep is seated -> standing -> seated (exercise). "stand" = count when fully standing
 * (the CDC 30-second chair stand counts each full stand, so a stand in progress at the buzzer is not lost).
 */
export function sitToStand(bands: StandBands = DEFAULT_BANDS, countOn: "return" | "stand" = "return", id: "sit_to_stand" | "chair_stand_30" = "sit_to_stand"): MoveLogic {
  let state: S = "unknown";
  let armed = false;       // true once we were seated and then reached the standing band
  let count = 0;
  let caved = false;       // knees caved during this rep
  let cueSent = false;

  return {
    id,
    needed: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE],
    get count() { return count; },
    reset() { state = "unknown"; armed = false; count = 0; caved = false; cueSent = false; },
    step(lm: Landmark[], _t: number, out: EngineEvent[]) {
      const h = hipHeight(lm);
      if (!Number.isFinite(h)) return;

      // form check only while moving between the bands (knees cave on the way up or down)
      if (h > bands.seatedBelow && h < bands.standingAbove + 0.2 && !cueSent) {
        const inward = Math.max(kneeInward(lm, "left"), kneeInward(lm, "right"));
        if (inward > T.kneeInward) caved = true;
        if (caved) { out.push({ type: "cue", move: id, text: "Keep knees over toes" }); cueSent = true; }
      }

      if (h <= bands.seatedBelow) {
        if (state === "standing" && armed) {
          armed = false;
          if (countOn === "return") { count++; out.push({ type: "rep", move: id, count }); }
          caved = false; cueSent = false; // new rep, fresh form check
        }
        state = "seated";
      } else if (h >= bands.standingAbove) {
        if (state === "seated") { armed = true; if (countOn === "stand") { count++; out.push({ type: "rep", move: id, count }); } }
        state = "standing";
      }
    },
  };
}
