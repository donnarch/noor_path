import { describe, expect, it } from "vitest";
import { SalahAnalyzer } from "@/lib/pose-analysis/analyzer";
import { DEFAULT_CONFIG } from "@/lib/pose-analysis/config";
import { extractFeatures } from "@/lib/pose-analysis/features";
import { classify, evaluate } from "@/lib/pose-analysis/rules";
import type { Landmark } from "@/lib/pose-analysis/types";

/* SYNTHETIC fixtures: side view facing right, normalised image coordinates (y points down).
   They test the maths and rules only, and are not a substitute for testing with a real camera. */
type Pt = readonly [number, number];
interface Pose { sh: Pt; hip: Pt; kn: Pt; an: Pt; nose: Pt; wr?: Pt }
function body(o: Pose, visibility = 1): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility }));
  const set = (i: number, p: Pt) => { lm[i] = { x: p[0], y: p[1], visibility }; };
  set(0, o.nose); [11, 12].forEach((i) => set(i, o.sh)); [23, 24].forEach((i) => set(i, o.hip));
  [25, 26].forEach((i) => set(i, o.kn)); [27, 28].forEach((i) => set(i, o.an)); [15, 16].forEach((i) => set(i, o.wr ?? o.kn));
  return lm;
}
const STAND: Pose = { sh: [0.5, 0.3], hip: [0.5, 0.55], kn: [0.5, 0.75], an: [0.5, 0.95], nose: [0.52, 0.22] };
const RUKU: Pose = { sh: [0.62, 0.5], hip: [0.4, 0.55], kn: [0.4, 0.75], an: [0.4, 0.95], nose: [0.72, 0.5] };
const RUKU_HIGH: Pose = { ...RUKU, sh: [0.55, 0.42], nose: [0.62, 0.4] };
const RUKU_BENT: Pose = { sh: [0.62, 0.55], hip: [0.4, 0.6], kn: [0.5, 0.78], an: [0.4, 0.95], nose: [0.72, 0.55] };
const RUKU_HANDS: Pose = { ...RUKU, wr: [0.7, 0.9] };
const HALF: Pose = { sh: [0.62, 0.32], hip: [0.5, 0.55], kn: [0.5, 0.75], an: [0.5, 0.95], nose: [0.66, 0.26] };
const SUJUD: Pose = { sh: [0.6, 0.8], hip: [0.35, 0.7], kn: [0.45, 0.88], an: [0.2, 0.9], nose: [0.72, 0.88] };
const SUJUD_LOW: Pose = { ...SUJUD, hip: [0.35, 0.85] };
const SUJUD_HEAD: Pose = { ...SUJUD, nose: [0.72, 0.7] };
const SIT: Pose = { sh: [0.42, 0.5], hip: [0.4, 0.82], kn: [0.6, 0.88], an: [0.35, 0.93], nose: [0.44, 0.4] };
const SIT_LEAN: Pose = { ...SIT, sh: [0.58, 0.55], nose: [0.62, 0.45] };
const feat = (o: Pose) => extractFeatures(body(o), DEFAULT_CONFIG).features!;
const ids = (p: Parameters<typeof evaluate>[0], o: Pose) => evaluate(p, feat(o), DEFAULT_CONFIG).map((i) => i.id);

describe("classification", () => {
  it("recognises each position", () => {
    expect(classify(feat(STAND), DEFAULT_CONFIG)).toBe("standing");
    expect(classify(feat(RUKU), DEFAULT_CONFIG)).toBe("ruku");
    expect(classify(feat(SUJUD), DEFAULT_CONFIG)).toBe("sujud");
    expect(classify(feat(SIT), DEFAULT_CONFIG)).toBe("sitting");
  });
  it("still recognises poor positions so they can be flagged", () => {
    expect(classify(feat(RUKU_HIGH), DEFAULT_CONFIG)).toBe("ruku");
    expect(classify(feat(RUKU_BENT), DEFAULT_CONFIG)).toBe("ruku");
    expect(classify(feat(SUJUD_LOW), DEFAULT_CONFIG)).toBe("sujud");
    expect(classify(feat(SIT_LEAN), DEFAULT_CONFIG)).toBe("sitting");
  });
  it("returns null for a half-way bend", () => expect(classify(feat(HALF), DEFAULT_CONFIG)).toBeNull());
});

describe("rules", () => {
  it("accepts good positions", () => {
    expect(ids("ruku", RUKU)).toEqual([]); expect(ids("sujud", SUJUD)).toEqual([]);
    expect(ids("sitting", SIT)).toEqual([]); expect(ids("standing", STAND)).toEqual([]);
  });
  it("flags ruku mistakes", () => {
    expect(ids("ruku", RUKU_HIGH)).toContain("ruku-back-high");
    expect(ids("ruku", RUKU_BENT)).toContain("ruku-knees-bent");
    expect(ids("ruku", RUKU_HANDS)).toContain("ruku-hands-off-knees");
  });
  it("flags sujud and sitting mistakes", () => {
    expect(ids("sujud", SUJUD_LOW)).toContain("sujud-hips-low");
    expect(ids("sujud", SUJUD_HEAD)).toContain("sujud-head-high");
    expect(ids("sitting", SIT_LEAN)).toContain("sit-lean");
  });
});

describe("reliability", () => {
  it("gives no features when landmarks are not visible enough", () => {
    const r = extractFeatures(body(STAND, 0.2), DEFAULT_CONFIG);
    expect(r.features).toBeNull(); expect(r.warnings.map((w) => w.id)).toContain("low-confidence");
  });
  it("warns when no body is found", () => expect(extractFeatures(null, DEFAULT_CONFIG).warnings[0].id).toBe("no-body"));
  it("warns when the body is cut off", () => {
    const lm = body(STAND); lm[27] = { x: 0.5, y: 1.2, visibility: 0.9 }; lm[28] = lm[27];
    expect(extractFeatures(lm, DEFAULT_CONFIG).warnings.map((w) => w.id)).toContain("cut-off");
  });
  it("warns when the person faces the camera", () => {
    const lm = body(STAND); lm[11] = { x: 0.3, y: 0.3, visibility: 1 }; lm[12] = { x: 0.7, y: 0.3, visibility: 1 };
    expect(extractFeatures(lm, DEFAULT_CONFIG).warnings.map((w) => w.id)).toContain("front-view");
  });
});

describe("analyzer over time", () => {
  const run = (a: SalahAnalyzer, o: Pose, from: number, ms: number, v = 1) => {
    const out = []; for (let t = from; t < from + ms; t += 66) out.push(a.update(body(o, v), t)); return out;
  };
  it("shows good, then issue with one moment for a sustained mistake", () => {
    const a = new SalahAnalyzer();
    const good = run(a, STAND, 0, 2000);
    expect(good[good.length - 1].status).toBe("good");
    const frames = run(a, RUKU_HIGH, 2000, 3500);
    const last = frames[frames.length - 1];
    expect(last.position).toBe("ruku"); expect(last.status).toBe("issue");
    const moments = frames.flatMap((f) => f.moments);
    expect(moments).toHaveLength(1); expect(moments[0].ruleId).toBe("ruku-back-high");
  });
  it("reports unknown (not good) for an unrecognised pose and explains it", () => {
    const a = new SalahAnalyzer();
    const frames = run(a, HALF, 0, 3000);
    const last = frames[frames.length - 1];
    expect(last.status).toBe("unknown"); expect(last.note).toMatch(/part of the way/);
    expect(frames.flatMap((f) => f.moments)).toHaveLength(0);
  });
  it("reports unreliable and stays quiet when tracking is poor", () => {
    const a = new SalahAnalyzer();
    const frames = run(a, RUKU_HIGH, 0, 4000, 0.2);
    expect(frames.every((f) => f.status === "unreliable" && f.moments.length === 0 && f.position === null)).toBe(true);
  });
  it("does not confirm a position from a single frame", () => {
    const a = new SalahAnalyzer();
    run(a, STAND, 0, 1500);
    expect(a.update(body(SIT), 1600).position).toBe("standing");
  });
  it("summarises a session", () => {
    const a = new SalahAnalyzer();
    run(a, STAND, 0, 2000); run(a, RUKU, 2000, 2000);
    const s = a.getSummary(4000);
    expect(s.sequence).toEqual(["standing", "ruku"]); expect(s.reliability).toBeGreaterThan(0.9);
  });
});