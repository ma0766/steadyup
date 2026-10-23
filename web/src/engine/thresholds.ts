// Starting points from docs/SPEC.md; final tuned values are logged in docs/PROGRESS.md.
export const SIT_TO_STAND = {
  /** hip height above ankles, in torso lengths. Below = seated band. */
  seatedBelow: 1.2,
  /** Above = standing band. The gap between the bands is hysteresis: jitter near one edge cannot double count. */
  standingAbove: 1.5,
  /** Knee moves toward the body midline by more than this many torso lengths (vs the ankle) = knees caving. */
  kneeInward: 0.12,
};
export type StandBands = { seatedBelow: number; standingAbove: number };
export const DEFAULT_BANDS: StandBands = { seatedBelow: SIT_TO_STAND.seatedBelow, standingAbove: SIT_TO_STAND.standingAbove };
export const SMOOTHING_ALPHA = 0.5;
/** CDC 30-second chair stand: arms crossed on the chest. Wrists this far below the shoulders (torso lengths) = arms came uncrossed. */
export const CHAIR_STAND = { wristsBelowShoulderT: 0.75 };

// Tuned on the synthetic fixtures in fixtures.ts; real-person check is on the human list.
export const HEEL_RAISE = { raiseFrac: 0.03, releaseFrac: 0.015, leanDeg: 15, stuckMs: 4000 }; // of leg length; torso lean in degrees
export const SIDE_LEG = { upDeg: 20, downDeg: 8, tiltDeg: 12 };
export const MARCH = {
  liftLineFrac: 0.5,   // knee above the mid-thigh line: knee-to-hip drop below 50% of its standing drop
  releaseFrac: 0.62,   // must drop back below this line before the same knee can count again
  wristAboveHipT: 0.4, // wrists this far (torso lengths) above the hips = left the chair
  wristBelowHipT: 0.6, // ... or this far below
  offChairMs: 700,
};
export const TANDEM = {
  inLineShoulderWidths: 0.3, // ankle x gap as a share of shoulder width. SPEC said 0.08; too tight for a real camera, tuned up
  swayRangeT: 0.3,           // hip sway over the last second, in torso lengths
  swayCooldownMs: 3000,
};
