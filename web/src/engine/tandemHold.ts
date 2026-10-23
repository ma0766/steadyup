import { type EngineEvent, type Landmark, LM } from "./types";
import { mid, shoulderWidth, torsoLength } from "./geometry";
import { TANDEM as T } from "./thresholds";
import type { MoveLogic } from "./engine";

// Feet in line (ankles nearly on top of each other seen from the front) = timer runs. It pauses when the feet come apart.
// Too much sway = a calm reminder to hold the chair.
export function tandemHold(): MoveLogic {
  let seconds = 0, lastT: number | null = null, whole = 0, lastCue = -Infinity;
  const hipX: { t: number; x: number }[] = [];
  return {
    id: "tandem_hold",
    needed: [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_ANKLE, LM.R_ANKLE],
    get count() { return whole; },
    reset() { seconds = 0; lastT = null; whole = 0; lastCue = -Infinity; hipX.length = 0; },
    step(lm: Landmark[], t: number, out: EngineEvent[]) {
      const dt = lastT === null ? 0 : Math.min(t - lastT, 200); lastT = t;
      const inLine = Math.abs(lm[LM.L_ANKLE].x - lm[LM.R_ANKLE].x) <= T.inLineShoulderWidths * shoulderWidth(lm);
      if (inLine) {
        seconds += dt / 1000;
        if (Math.floor(seconds) > whole) { whole = Math.floor(seconds); out.push({ type: "hold", move: "tandem_hold", seconds: whole }); }
      }
      hipX.push({ t, x: mid(lm[LM.L_HIP], lm[LM.R_HIP]).x });
      while (hipX.length && t - hipX[0].t > 1000) hipX.shift();
      const xs = hipX.map((p) => p.x);
      const sway = (Math.max(...xs) - Math.min(...xs)) / torsoLength(lm);
      if (inLine && sway > T.swayRangeT && t - lastCue > T.swayCooldownMs) { lastCue = t; out.push({ type: "cue", move: "tandem_hold", text: "Hold the chair, that's fine" }); }
    },
  };
}
