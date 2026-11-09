import { DEFAULT_CONFIG, type Config } from "./config";
import { extractFeatures } from "./features";
import { classify, evaluate } from "./rules";
import type { Features, Frame, Issue, Landmark, Moment, Position, Status, Summary } from "./types";

export { DEFAULT_CONFIG };

interface Segment { position: Position; start: number; end?: number }

function gapNote(f: Features, c: Config): string {
  if (f.hipHeight >= c.family.minUprightHip && f.torso > c.standing.maxTorso && f.torso < c.ruku.minTorso)
    return "You are bending part of the way. Bend until your back is level for ruku, or stand upright.";
  return "This doesn’t match a prayer position I know. You may be moving between positions, or the camera may not see your side.";
}

/** Stateful analyzer: smooths landmarks, confirms positions over time and emits reviewable moments. */
export class SalahAnalyzer {
  private cfg: Config;
  private smooth: Landmark[] | null = null;
  private votes: (Position | null)[] = [];
  private confirmed: Position | null = null;
  private pending: Position | null = null;
  private pendingSince = 0;
  private unknownSince: number | null = null;
  private segments: Segment[] = [];
  private since = new Map<string, number>();
  private lastFired = new Map<string, number>();
  private total = 0;
  private reliableFrames = 0;
  private momentCount = 0;

  constructor(cfg: Config = DEFAULT_CONFIG) { this.cfg = cfg; }

  reset() {
    this.smooth = null; this.votes = []; this.confirmed = null; this.pending = null; this.unknownSince = null;
    this.segments = []; this.since.clear(); this.lastFired.clear(); this.total = 0; this.reliableFrames = 0; this.momentCount = 0;
  }

  private smoothed(lm: Landmark[]): Landmark[] {
    const a = this.cfg.smoothing.alpha;
    this.smooth = lm.map((p, i) => {
      const o = this.smooth?.[i];
      return o ? { x: o.x + (p.x - o.x) * a, y: o.y + (p.y - o.y) * a, z: p.z, visibility: p.visibility } : { ...p };
    });
    return this.smooth;
  }

  update(lm: Landmark[] | null, t: number): Frame {
    const s = this.cfg.smoothing;
    this.total++;
    const sm = lm ? this.smoothed(lm) : null;
    const { features, warnings } = extractFeatures(sm, this.cfg);
    if (!features) {
      this.since.clear(); this.unknownSince = null;
      return { reliable: false, status: "unreliable", note: "", warnings, position: this.confirmed, candidate: null, features: null, issues: [], moments: [], smoothed: sm };
    }
    this.reliableFrames++;

    const candidate = classify(features, this.cfg);
    this.votes.push(candidate);
    if (this.votes.length > s.window) this.votes.shift();
    const counts = new Map<Position, number>();
    this.votes.forEach((v) => v && counts.set(v, (counts.get(v) ?? 0) + 1));
    let top: Position | null = null, best = 0;
    counts.forEach((n, p) => { if (n > best) { best = n; top = p; } });
    const stable = top && best / this.votes.length >= s.agree ? top : null;

    if (stable && stable !== this.confirmed) {
      if (this.pending !== stable) { this.pending = stable; this.pendingSince = t; }
      else if (t - this.pendingSince >= s.holdMs) {
        const last = this.segments[this.segments.length - 1];
        if (last) last.end = t;
        this.segments.push({ position: stable, start: this.pendingSince });
        this.confirmed = stable; this.pending = null; this.since.clear();
      }
    } else this.pending = null;

    if (candidate === null) { if (this.unknownSince === null) this.unknownSince = t; } else this.unknownSince = null;
    const unknownLong = this.unknownSince !== null && t - this.unknownSince >= s.unknownMs;

    const issues: Issue[] = [], moments: Moment[] = [];
    if (this.confirmed && candidate === this.confirmed) {
      const now = evaluate(this.confirmed, features, this.cfg);
      const ids = new Set(now.map((i) => i.id));
      Array.from(this.since.keys()).forEach((k) => { if (!ids.has(k)) this.since.delete(k); });
      for (const issue of now) {
        if (!this.since.has(issue.id)) this.since.set(issue.id, t);
        if (t - this.since.get(issue.id)! < s.issueMs) continue;
        issues.push(issue);
        if (t - (this.lastFired.get(issue.id) ?? -Infinity) >= s.cooldownMs) {
          this.lastFired.set(issue.id, t); this.momentCount++;
          moments.push({ ruleId: issue.id, position: issue.position, message: issue.message, t });
        }
      }
    } else this.since.clear();

    let status: Status, note = "";
    if (issues.length) status = "issue";
    else if (unknownLong) { status = "unknown"; note = gapNote(features, this.cfg); }
    else status = this.confirmed ? "good" : "unknown";

    return { reliable: true, status, note, warnings: [], position: this.confirmed, candidate, features, issues, moments, smoothed: sm };
  }

  getSummary(endT: number): Summary {
    const totals = new Map<Position, number>();
    this.segments.forEach((g) => totals.set(g.position, (totals.get(g.position) ?? 0) + ((g.end ?? endT) - g.start)));
    return {
      durationMs: endT,
      reliability: this.total ? this.reliableFrames / this.total : 0,
      positions: Array.from(totals, ([position, ms]) => ({ position, ms })),
      sequence: this.segments.map((g) => g.position),
      momentCount: this.momentCount,
    };
  }
}