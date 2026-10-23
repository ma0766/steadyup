// Engine types. The engine is pure: frames in, events out. No DOM, no timers, no network.
export type Landmark = { x: number; y: number; visibility: number };
export type Frame = { t: number; lm: Landmark[] | null }; // t in ms; null = nobody detected

export type MoveId = "sit_to_stand" | "heel_raise" | "side_leg_raise" | "march" | "tandem_hold";

export type EngineEvent =
  | { type: "rep"; move: MoveId; count: number; side?: "left" | "right" }
  | { type: "cue"; move: MoveId; text: string }
  | { type: "hold"; move: MoveId; seconds: number }
  | { type: "low-confidence" } // fires once when the body leaves view
  | { type: "back-in-view" };

// MediaPipe pose landmark indices we use
export const LM = {
  NOSE: 0, L_SHOULDER: 11, R_SHOULDER: 12, L_ELBOW: 13, R_ELBOW: 14, L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24, L_KNEE: 25, R_KNEE: 26, L_ANKLE: 27, R_ANKLE: 28,
  L_HEEL: 29, R_HEEL: 30, L_FOOT: 31, R_FOOT: 32,
} as const;

export const MIN_VISIBILITY = 0.5;
