/** All thresholds are configurable and are educational heuristics, not religious requirements. */
export const DEFAULT_CONFIG = {
  minVisibility: 0.5,
  minTorsoLen: 0.06,
  maxShoulderRatio: 0.9,

  standing: { maxTorso: 25, minKnee: 150, minHip: 150 },
  ruku: { minKnee: 140, maxHip: 145, minTorso: 35, maxTorso: 115 },
  sujud: { maxKnee: 115, minTorso: 60, minNoseVsKnee: -0.8 },
  sitting: { maxKnee: 115, maxTorso: 40 },
  rules: {
    rukuBackMin: 65,
    rukuBackMax: 105,
    rukuKneeMin: 150,
    standLeanMax: 15,
    sujudHipsLowMargin: 0.03,
    sitLeanMax: 25,
  },
  smoothing: {
    alpha: 0.5,
    window: 8,
    agree: 0.6,
    holdMs: 500,
    issueMs: 500,
    cooldownMs: 4000,
  },
};
export type Config = typeof DEFAULT_CONFIG;
