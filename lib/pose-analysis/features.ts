import type { Config } from "./config";
import { angleAt, dist, tiltFromVertical } from "./geometry";
import type { Features, Landmark, Warning } from "./types";

const IDX = { left: { nose: 0, sh: 11, wr: 15, hip: 23, kn: 25, an: 27 }, right: { nose: 0, sh: 12, wr: 16, hip: 24, kn: 26, an: 28 } };
const vis = (l?: Landmark) => l?.visibility ?? 0;
const outside = (l: Landmark) => l.x < -0.02 || l.x > 1.02 || l.y < -0.02 || l.y > 1.02;

export interface Extracted { features: Features | null; quality: number; warnings: Warning[] }

export function extractFeatures(lm: Landmark[] | null, cfg: Config): Extracted {
  if (!lm || lm.length < 29) return { features: null, quality: 0, warnings: [{ id: "no-body", message: "No body detected. Step back so your whole body is in view." }] };
  const score = (s: "left" | "right") => [IDX[s].sh, IDX[s].hip, IDX[s].kn, IDX[s].an].reduce((a, i) => a + vis(lm[i]), 0);
  const side = score("left") >= score("right") ? "left" : "right";
  const i = IDX[side];
  const sh = lm[i.sh], hip = lm[i.hip], kn = lm[i.kn], an = lm[i.an], nose = lm[i.nose], wr = lm[i.wr];
  const quality = Math.min(vis(sh), vis(hip), vis(kn), vis(an));
  const warnings: Warning[] = [];
  if ([sh, hip, kn, an].some(outside)) warnings.push({ id: "cut-off", message: "Part of your body is out of frame. Move back or tilt the camera so your head and feet are visible." });
  if (quality < cfg.minVisibility) warnings.push({ id: "low-confidence", message: "Tracking confidence is too low to assess this movement. Check the lighting and that your whole side is visible." });
  const torsoLen = dist(sh, hip);
  if (torsoLen < cfg.minTorsoLen) warnings.push({ id: "too-far", message: "You look very small in the frame. Move closer to the camera." });
  if (vis(lm[11]) > cfg.minVisibility && vis(lm[12]) > cfg.minVisibility && Math.abs(lm[11].x - lm[12].x) / torsoLen > cfg.maxShoulderRatio)
    warnings.push({ id: "front-view", message: "You are facing the camera. Turn so the camera sees your side (left or right), then it can follow your positions." });
  if (warnings.length) return { features: null, quality, warnings };
  const features: Features = {
    side,
    torso: tiltFromVertical(hip, sh),
    knee: angleAt(hip, kn, an),
    hip: angleAt(sh, hip, kn),
    hipLowness: (hip.y - sh.y) / torsoLen,
    noseVsKnee: (nose.y - kn.y) / torsoLen,
    hipHeight: (an.y - hip.y) / torsoLen,
    headDrop: (nose.y - sh.y) / torsoLen,
    handToKnee: vis(wr) >= cfg.minVisibility ? dist(wr, kn) / torsoLen : null,
  };
  return { features, quality, warnings };
}