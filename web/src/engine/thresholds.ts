// Starting points from docs/SPEC.md; final tuned values are logged in docs/PROGRESS.md.
export const SIT_TO_STAND = {
  /** hip height above ankles, in torso lengths. Below = seated band. */
  seatedBelow: 1.2,
  /** Above = standing band. The gap between the bands is hysteresis: jitter near one edge cannot double count. */
  standingAbove: 1.5,
  /** Knee moves toward the body midline by more than this many torso lengths (vs the ankle) = knees caving. */
  kneeInward: 0.12,
};
export const SMOOTHING_ALPHA = 0.5;
