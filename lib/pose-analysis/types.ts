export interface Landmark { x: number; y: number; z?: number; visibility?: number }
export type Position = "standing" | "ruku" | "sujud" | "sitting";

export interface Features {
  side: "left" | "right";
  /** Back tilt in degrees: 0 = upright, 90 = level, >90 = shoulders lower than hips. */
  torso: number;
  /** Knee angle in degrees: 180 = straight leg. */
  knee: number;
  /** Hip angle in degrees: 180 = straight body line. */
  hip: number;
  /** (hip.y - shoulder.y) / torso length. Positive means the hips are lower than the shoulders. */
  hipLowness: number;
  /** (nose.y - knee.y) / torso length. Near or above 0 means the head is down at knee height. */
  noseVsKnee: number;
}
export type WarningId = "no-body" | "low-confidence" | "cut-off" | "too-far" | "front-view";
export interface Warning { id: WarningId; message: string }
export interface Issue { id: string; position: Position; message: string }
export interface Moment { ruleId: string; position: Position; message: string; t: number }
export interface Frame {
  reliable: boolean;
  warnings: Warning[];
  /** The confirmed position, after smoothing and a short hold. */
  position: Position | null;
  /** What this instant looks like, before confirmation. */
  candidate: Position | null;
  features: Features | null;
  /** Observations that have lasted long enough to show to the learner. */
  issues: Issue[];
  /** New moments worth reviewing, emitted once per cooldown. */
  moments: Moment[];
  smoothed: Landmark[] | null;
}
export interface Summary {
  durationMs: number;
  reliability: number;
  positions: { position: Position; ms: number }[];
  sequence: Position[];
  momentCount: number;
}
