import { type EngineEvent, type Landmark, LM, MIN_VISIBILITY } from "./types";
import { mid, torsoLength } from "./geometry";
import { sitToStand } from "./sitToStand";
import { CHAIR_STAND, type StandBands } from "./thresholds";
import type { MoveLogic } from "./engine";

/**
 * CDC STEADI 30-Second Chair Stand: count every full stand. The TV runs the 30 seconds; this only counts.
 * One gentle reminder if the arms come uncrossed (the test is done with arms crossed on the chest).
 */
export function chairStand30(bands?: StandBands): MoveLogic {
  const inner = sitToStand(bands, "stand", "chair_stand_30");
  let armsCue = false, uncrossedSince: number | null = null;
  return {
    id: "chair_stand_30",
    needed: inner.needed,
    get count() { return inner.count; },
    reset() { inner.reset(); armsCue = false; uncrossedSince = null; },
    step(lm: Landmark[], t: number, out: EngineEvent[]) {
      inner.step(lm, t, out);
      const w = [lm[LM.L_WRIST], lm[LM.R_WRIST]];
      if (w.every((p) => p.visibility >= MIN_VISIBILITY)) {
        const shoulderY = mid(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]).y, tl = torsoLength(lm);
        const hanging = w.every((p) => p.y - shoulderY > CHAIR_STAND.wristsBelowShoulderT * tl);
        if (hanging) { uncrossedSince ??= t; if (!armsCue && t - uncrossedSince > 1500) { out.push({ type: "cue", move: "chair_stand_30", text: "Cross your arms on your chest" }); armsCue = true; } }
        else uncrossedSince = null;
      }
    },
  };
}
