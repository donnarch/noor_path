export interface P { x: number; y: number }
const deg = (r: number) => (r * 180) / Math.PI;

/** Angle at b (degrees) between segments b-a and b-c. */
export function angleAt(a: P, b: P, c: P): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
  const d = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!d) return 180;
  return deg(Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / d))));
}
/** Tilt of the segment from→to away from straight up (image y points down). 0 = up, 90 = sideways, >90 = downward. */
export const tiltFromVertical = (from: P, to: P): number => deg(Math.atan2(Math.abs(to.x - from.x), from.y - to.y));
export const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
