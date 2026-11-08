import type { Landmark } from "@/lib/pose-analysis/types";

/** Draws the skeleton. Landmark coordinates are normalised (0 to 1). */
export function drawSkeleton(ctx: CanvasRenderingContext2D, lm: Landmark[], w: number, h: number, conns: { start: number; end: number }[], color = "#38BDF8") {
  const ok = (p?: Landmark) => !!p && (p.visibility ?? 1) > 0.25;
  const line = Math.max(4, w / 160);
  ctx.lineWidth = line; ctx.lineCap = "round"; ctx.strokeStyle = color;
  for (const c of conns) {
    const a = lm[c.start], b = lm[c.end];
    if (!ok(a) || !ok(b)) continue;
    ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
  }
  lm.forEach((p, i) => {
    if (!ok(p) || (i > 0 && i < 11)) return; // skip face detail points except the nose
    ctx.beginPath(); ctx.arc(p.x * w, p.y * h, line * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.lineWidth = line * 0.6; ctx.strokeStyle = color; ctx.stroke(); ctx.lineWidth = line;
  });
}