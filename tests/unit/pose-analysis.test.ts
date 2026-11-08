import { describe, expect, it } from "vitest";
import { SalahAnalyzer } from "@/lib/pose-analysis/analyzer";
import { DEFAULT_CONFIG } from "@/lib/pose-analysis/config";
import { extractFeatures } from "@/lib/pose-analysis/features";
import { classify, evaluate } from "@/lib/pose-analysis/rules";
import type { Landmark } from "@/lib/pose-analysis/types";

/* SYNTHETIC fixtures: side view facing right, normalised image coordinates (y points down).
   These test the maths and rules only. They are not a substitute for testing with a real camera. */
type Pt = [number, number];
function body(o: { sh: Pt; hip: Pt; kn: Pt; an: Pt; nose: Pt }, visibility = 1): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility }));
  const set = (i: number, p: Pt) => { lm[i] = { x: p[0], y: p[1], visibility }; };
  set(0, o.nose); [11, 12].forEach((i) => set(i, o.sh)); [23, 24].forEach((i) => set(i, o.hip)); [25, 26].forEach((i) => set(i, o.kn)); [27, 28].forEach((i) => set(i, o.an));
  return lm;
}
const STAND = { sh: [0.5, 0.3], hip: [0.5, 0.55], kn: [0.5, 0.75], an: [0.5, 0.95], nose: [0.52, 0.22] } as const;
const RUKU = { sh: [0.62, 0.5], hip: [0.4, 0.55], kn: [0.4, 0.75], an: [0.4, 0.95], nose: [0.72, 0.5] } as const;
const RUKU_HIGH = { ...RUKU, sh: [0.55, 0.35], nose: [0.6, 0.28] } as const;
const SUJUD = { sh: [0.6, 0.8], hip: [0.35, 0.7], kn: [0.45, 0.88], an: [0.2, 0.9], nose: [0.72, 0.88] } as const;
const SUJUD_LOW = { ...SUJUD, hip: [0.35, 0.85] } as const;
const SIT = { sh: [0.42, 0.5], hip: [0.4, 0.82], kn: [0.6, 0.88], an: [0.35, 0.93], nose: [0.44, 0.4] } as const;
const mk = (o: { sh: Readonly<Pt>; hip: Readonly<Pt>; kn: Readonly<Pt>; an: Readonly<Pt>; nose: Readonly<Pt> }, v = 1) =>
  body({ sh: [...o.sh], hip: [...o.hip], kn: [...o.kn], an: [...o.an], nose: [...o.nose] }, v);
const feat = (o: Parameters<typeof mk>[0]) => extractFeatures(mk(o), DEFAULT_CONFIG).features!;

describe("position classification", () => {
  it("recognises each position", () => {
    expect(classify(feat(STAND), DEFAULT_CONFIG)).toBe("standing");
    expect(classify(feat(RUKU), DEFAULT_CONFIG)).toBe("ruku");
    expect(classify(feat(SUJUD), DEFAULT_CONFIG)).toBe("sujud");
    expect(classify(feat(SIT), DEFAULT_CONFIG)).toBe("sitting");
  });
});

describe("rules", () => {
  it("flags a raised back in ruku but not a level one", () => {
    expect(evaluate("ruku", feat(RUKU_HIGH), DEFAULT_CONFIG).map((i) => i.id)).toContain("ruku-back-high");
    expect(evaluate("ruku", feat(RUKU), DEFAULT_CONFIG)).toEqual([]);
  });
  it("flags low hips in sujud but not a good sujud", () => {
    expect(classify(feat(SUJUD_LOW), DEFAULT_CONFIG)).toBe("sujud");
    expect(evaluate("sujud", feat(SUJUD_LOW), DEFAULT_CONFIG).map((i) => i.id)).toContain("sujud-hips-low");
    expect(evaluate("sujud", feat(SUJUD), DEFAULT_CONFIG)).toEqual([]);
  });
});

describe("reliability", () => {
  it("gives no features when landmarks are not visible enough", () => {
    const r = extractFeatures(mk(STAND, 0.2), DEFAULT_CONFIG);
    expect(r.features).toBeNull();
    expect(r.warnings.map((w) => w.id)).toContain("low-confidence");
  });
  it("warns when no body is found", () => expect(extractFeatures(null, DEFAULT_CONFIG).warnings[0].id).toBe("no-body"));
  it("warns when the body is cut off", () => {
    const lm = mk(STAND); lm[27] = { x: 0.5, y: 1.2, visibility: 0.9 }; lm[28] = lm[27];
    expect(extractFeatures(lm, DEFAULT_CONFIG).warnings.map((w) => w.id)).toContain("cut-off");
  });
});

describe("analyzer over time", () => {
  const run = (a: SalahAnalyzer, o: Parameters<typeof mk>[0], from: number, ms: number, v = 1) => {
    const out = []; for (let t = from; t < from + ms; t += 66) out.push(a.update(mk(o, v), t)); return out;
  };
  it("confirms positions after a short hold and emits one moment for a sustained mistake", () => {
    const a = new SalahAnalyzer();
    run(a, STAND, 0, 2000);
    const frames = run(a, RUKU_HIGH, 2000, 3500);
    expect(frames[frames.length - 1].position).toBe("ruku");
    const moments = frames.flatMap((f) => f.moments);
    expect(moments).toHaveLength(1);
    expect(moments[0].ruleId).toBe("ruku-back-high");
  });
  it("does not report anything while tracking is unreliable", () => {
    const a = new SalahAnalyzer();
    const frames = run(a, RUKU_HIGH, 0, 4000, 0.2);
    expect(frames.every((f) => !f.reliable && f.moments.length === 0 && f.position === null)).toBe(true);
  });
  it("does not confirm a position from a single frame", () => {
    const a = new SalahAnalyzer();
    run(a, STAND, 0, 1500);
    const f = a.update(mk(SIT), 1600);
    expect(f.position).toBe("standing");
  });
  it("summarises a session", () => {
    const a = new SalahAnalyzer();
    run(a, STAND, 0, 2000); run(a, RUKU, 2000, 2000);
    const s = a.getSummary(4000);
    expect(s.sequence).toEqual(["standing", "ruku"]);
    expect(s.reliability).toBeGreaterThan(0.9);
  });
});
