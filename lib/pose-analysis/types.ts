export interface Landmark { x: number; y: number; z?: number; visibility?: number }
export type Position = "standing" | "ruku" | "sujud" | "sitting";
/** good = recognised and looks fine, issue = may need attention, unknown = not recognised, unreliable = cannot track well. */
export type Status = "good" | "issue" | "unknown" | "unreliable";

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
  /** (ankle.y - hip.y) / torso length. Large when the legs are upright, small when sitting or prostrating. */
  hipHeight: number;
  /** (nose.y - shoulder.y) / torso length. Large positive means the head hangs low. */
  headDrop: number;
  /** Distance from wrist to knee / torso length, or null if the wrist is not visible. */
  handToKnee: number | null;
}
export type WarningId = "no-body" | "low-confidence" | "cut-off" | "too-far" | "front-view";
export interface Warning { id: WarningId; message: string }
export interface Issue { id: string; position: Position; message: string }
export interface Moment { ruleId: string; position: Position; message: string; t: number }
export interface Frame {
  reliable: boolean;
  status: Status;
  /** Explains the "unknown" status in plain words. */
  note: string;
  warnings: Warning[];
  position: Position | null;
  candidate: Position | null;
  features: Features | null;
  issues: Issue[];
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