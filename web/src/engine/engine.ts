// Engine = smoothing + confidence gate + one move's state machine.
import { type EngineEvent, type Frame, type Landmark, type MoveId, MIN_VISIBILITY } from "./types";
import { SMOOTHING_ALPHA } from "./thresholds";
import { sitToStand } from "./sitToStand";
import { heelRaise } from "./heelRaise";
import { sideLegRaise } from "./sideLegRaise";
import { march } from "./march";
import { tandemHold } from "./tandemHold";

export interface MoveLogic {
  id: MoveId;
  /** landmark indices that must be visible for this move to count anything */
  needed: readonly number[];
  step(lm: Landmark[], tMs: number, out: EngineEvent[]): void;
  reset(): void;
  readonly count: number;
}

export interface MoveEngine {
  push(frame: Frame): EngineEvent[];
  reset(): void;
  readonly count: number;
}

export type EngineOptions = { alpha?: number; side?: "left" | "right" };

const LOGIC: Record<MoveId, (side: "left" | "right") => MoveLogic> = {
  sit_to_stand: () => sitToStand(),
  heel_raise: () => heelRaise(),
  side_leg_raise: (side) => sideLegRaise(side),
  march: () => march(),
  tandem_hold: () => tandemHold(),
};

export function createEngine(move: MoveId, opts: EngineOptions | number = {}): MoveEngine {
  const o: EngineOptions = typeof opts === "number" ? { alpha: opts } : opts;
  const alpha = o.alpha ?? SMOOTHING_ALPHA;
  const make = LOGIC[move];
  if (!make) throw new Error(`unknown move: ${move}`);
  const logic = make(o.side ?? "left");
  let prev: Landmark[] | null = null;
  let inView = true;

  return {
    get count() { return logic.count; },
    reset() { logic.reset(); prev = null; inView = true; },
    push(frame) {
      const out: EngineEvent[] = [];
      const lm = frame.lm;
      const visible = !!lm && lm.length >= 33 && logic.needed.every((i) => lm[i].visibility >= MIN_VISIBILITY);
      if (!visible) {
        // confidence gate: count nothing, say it once, forget smoothing history so a stale pose cannot leak in
        if (inView) out.push({ type: "low-confidence" });
        inView = false; prev = null;
        return out;
      }
      if (!inView) { out.push({ type: "back-in-view" }); inView = true; }
      // exponential moving average per landmark: hides jitter, costs a little lag
      const sm: Landmark[] = prev
        ? lm.map((p, i) => ({ x: prev![i].x + alpha * (p.x - prev![i].x), y: prev![i].y + alpha * (p.y - prev![i].y), visibility: p.visibility }))
        : lm.map((p) => ({ ...p }));
      prev = sm;
      logic.step(sm, frame.t, out);
      return out;
    },
  };
}
