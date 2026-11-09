import type { Config } from "./config";
import type { Features, Issue, Position } from "./types";

/** Coarse classification first (which family of position is this), strict checks afterwards.
 *  A poor position therefore still gets recognised and can be flagged, instead of being ignored. */
export function classify(f: Features, c: Config): Position | null {
  if (f.hipHeight >= c.family.minUprightHip) {
    if (f.torso <= c.standing.maxTorso) return "standing";
    if (f.torso >= c.ruku.minTorso && f.torso <= c.ruku.maxTorso) return "ruku";
    return null;
  }
  if (f.torso >= c.sujud.minTorso && f.noseVsKnee >= c.sujud.minNoseVsKnee) return "sujud";
  if (f.torso <= c.sitting.maxTorso) return "sitting";
  return null;
}

/** Gentle, observation-style suggestions. They are educational and never a ruling on a prayer. */
export function evaluate(p: Position, f: Features, c: Config): Issue[] {
  const r = c.rules, out: Issue[] = [];
  const add = (id: string, message: string) => out.push({ id, position: p, message });
  if (p === "ruku") {
    if (f.torso < r.rukuBackMin) add("ruku-back-high", "Your back is rising. Lower your shoulders until your back is level.");
    if (f.torso > r.rukuBackMax) add("ruku-back-low", "Your shoulders look lower than your hips. Keep your back level.");
    if (f.knee < r.rukuKneeMin) add("ruku-knees-bent", "Your knees are bent. Straighten your legs, without locking them.");
    if (f.headDrop > r.rukuHeadMax) add("ruku-head-low", "Your head is hanging low. Keep your head in line with your back.");
    if (f.headDrop < r.rukuHeadMin) add("ruku-head-high", "Your head is raised. Keep your head in line with your back.");
    if (f.handToKnee !== null && f.handToKnee > r.rukuHandsMax) add("ruku-hands-off-knees", "Rest your hands on your knees.");
  }
  if (p === "standing" && f.torso > r.standLeanMax) add("stand-lean", "You are leaning. Stand upright and relaxed.");
  if (p === "sujud") {
    if (f.hipLowness > r.sujudHipsLowMargin) add("sujud-hips-low", "Your hips are lower than your shoulders. Lift your hips a little.");
    if (f.noseVsKnee < r.sujudHeadMin) add("sujud-head-high", "Your head is not down yet. Lower your forehead and nose to the floor.");
  }
  if (p === "sitting" && f.torso > r.sitLeanMax) add("sit-lean", "You are leaning forward. Sit up tall and relaxed.");
  return out;
}