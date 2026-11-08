import type { Config } from "./config";
import type { Features, Issue, Position } from "./types";

export function classify(f: Features, c: Config): Position | null {
  if (f.torso <= c.standing.maxTorso && f.knee >= c.standing.minKnee && f.hip >= c.standing.minHip) return "standing";
  if (f.knee >= c.ruku.minKnee && f.hip <= c.ruku.maxHip && f.torso >= c.ruku.minTorso && f.torso <= c.ruku.maxTorso) return "ruku";
  if (f.knee <= c.sujud.maxKnee && f.torso >= c.sujud.minTorso && f.noseVsKnee >= c.sujud.minNoseVsKnee) return "sujud";
  if (f.knee <= c.sitting.maxKnee && f.torso <= c.sitting.maxTorso) return "sitting";
  return null;
}

/** Gentle, observation-style suggestions. They are educational and never a ruling on a prayer. */
export function evaluate(p: Position, f: Features, c: Config): Issue[] {
  const r = c.rules, out: Issue[] = [];
  const add = (id: string, message: string) => out.push({ id, position: p, message });
  if (p === "ruku") {
    if (f.torso < r.rukuBackMin) add("ruku-back-high", "Your back looks like it is rising. Try lowering your shoulders until your back is level.");
    if (f.torso > r.rukuBackMax) add("ruku-back-low", "Your shoulders look lower than your hips. Try keeping your back level.");
    if (f.knee < r.rukuKneeMin) add("ruku-knees-bent", "Your knees look bent. Try keeping your legs straight, without locking them.");
  }
  if (p === "standing" && f.torso > r.standLeanMax) add("stand-lean", "You may be leaning a little. Try standing upright and relaxed.");
  if (p === "sujud" && f.hipLowness > r.sujudHipsLowMargin) add("sujud-hips-low", "Your hips look lower than your shoulders. Try lifting your hips a little.");
  if (p === "sitting" && f.torso > r.sitLeanMax) add("sit-lean", "You may be leaning forward. Try sitting up tall and relaxed.");
  return out;
}
