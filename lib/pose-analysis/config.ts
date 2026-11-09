/** All thresholds are configurable educational heuristics, not religious requirements. Tune them with real recordings. */
export const DEFAULT_CONFIG = {
  minVisibility: 0.5,
  minTorsoLen: 0.06,
  maxShoulderRatio: 0.9,
  family: { minUprightHip: 1.1 },
  standing: { maxTorso: 20 },
  ruku: { minTorso: 40, maxTorso: 120 },
  sujud: { minTorso: 55, minNoseVsKnee: -0.8 },
  sitting: { maxTorso: 35 },
  rules: {
    rukuBackMin: 72, rukuBackMax: 105, rukuKneeMin: 150, rukuHeadMax: 0.6, rukuHeadMin: -0.6, rukuHandsMax: 1.0,
    standLeanMax: 14, sujudHipsLowMargin: 0.03, sujudHeadMin: -0.4, sitLeanMax: 22,
  },
  smoothing: { alpha: 0.6, window: 8, agree: 0.6, holdMs: 400, issueMs: 400, cooldownMs: 4000, unknownMs: 1500 },
};
export type Config = typeof DEFAULT_CONFIG;