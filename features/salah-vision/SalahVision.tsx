"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createDetector, type Detector } from "@/lib/pose-detection/landmarker";
import { drawSkeleton } from "@/lib/pose-detection/draw";
import { SalahAnalyzer } from "@/lib/pose-analysis/analyzer";
import type { Landmark, Moment, Position, Status, Summary, Warning } from "@/lib/pose-analysis/types";
import { updateProgress } from "@/lib/storage/progress";

type Phase = "intro" | "setup" | "live" | "review";
interface ReviewMoment extends Moment { photo?: string }
interface Review { summary: Summary; moments: ReviewMoment[]; videoUrl?: string; ext: string }
interface Ui { position: Position | null; warnings: Warning[]; tip: string; note: string; status: Status; reliable: boolean; debug: string }
interface Draw { lm: Landmark[] | null; color: string; label: string; tip: string; status: Status }

const LABEL: Record<Position, string> = { standing: "Standing (qiyam)", ruku: "Bowing (ruku)", sujud: "Prostration (sujud)", sitting: "Sitting (jalsa or tashahhud)" };
const COLOR: Record<Status, string> = { good: "#22C55E", issue: "#EF4444", unknown: "#F59E0B", unreliable: "#9AA7BD" };
const fmt = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
type Conns = { start: number; end: number }[];

/** Paints one frame: the camera image, the skeleton, a time/position label and, for mistakes, a red message bar.
 *  Used for both the photos and the recorded video, so they show the mistakes themselves. */
function paintFrame(ctx: CanvasRenderingContext2D, v: HTMLVideoElement, w: number, h: number, d: Draw | null, conns: Conns, tMs: number) {
  ctx.drawImage(v, 0, 0, w, h);
  if (d?.lm) drawSkeleton(ctx, d.lm, w, h, conns, d.color);
  const fs = Math.max(14, Math.round(w / 34));
  ctx.font = `600 ${fs}px system-ui, sans-serif`; ctx.textBaseline = "top";
  const label = `${fmt(tMs)}${d?.label ? "  ·  " + d.label : ""}`;
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(10, 10, ctx.measureText(label).width + 24, fs + 16);
  ctx.fillStyle = "#fff"; ctx.fillText(label, 22, 18);
  if (d && d.status === "issue" && d.tip) {
    const words = d.tip.split(" "), lines: string[] = []; let cur = "";
    for (const wd of words) { const next = cur ? cur + " " + wd : wd; if (ctx.measureText(next).width > w - 60 && cur) { lines.push(cur); cur = wd; } else cur = next; }
    lines.push(cur);
    const bh = lines.length * (fs + 6) + 20;
    ctx.fillStyle = "rgba(220,38,38,.92)"; ctx.fillRect(0, h - bh, w, bh);
    ctx.fillStyle = "#fff"; lines.forEach((ln, i) => ctx.fillText(ln, 20, h - bh + 12 + i * (fs + 6)));
    ctx.strokeStyle = "#EF4444"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
  }
}
function snapshot(v: HTMLVideoElement, d: Draw | null, conns: Conns, tMs: number) {
  const w = Math.min(720, v.videoWidth), h = Math.round((w * v.videoHeight) / v.videoWidth);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  paintFrame(c.getContext("2d")!, v, w, h, d, conns, tMs);
  return c.toDataURL("image/jpeg", 0.8);
}
function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export default function SalahVision() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [opts, setOpts] = useState({ photos: true, video: false, facing: "user" as "user" | "environment" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [ui, setUi] = useState<Ui>({ position: null, warnings: [], tip: "", note: "", status: "unreliable", reliable: false, debug: "" });
  const [elapsed, setElapsed] = useState(0);
  const [review, setReview] = useState<Review | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reviewVideo = useRef<HTMLVideoElement>(null);
  const recCanvas = useRef<HTMLCanvasElement | null>(null);
  const detector = useRef<Detector | null>(null);
  const analyzer = useRef(new SalahAnalyzer());
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const moments = useRef<ReviewMoment[]>([]);
  const lastDraw = useRef<Draw | null>(null);
  const raf = useRef(0);
  const t0 = useRef(0);
  const phaseRef = useRef<Phase>("intro");
  const optsRef = useRef(opts);
  const lastUi = useRef("");
  const urlRef = useRef<string | undefined>(undefined);
  phaseRef.current = phase; optsRef.current = opts;

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => () => { stopCamera(); detector.current?.close(); detector.current = null; if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, [stopCamera]);

  const loop = useCallback(() => {
    let last = 0, tried = 0, total = 0, found = false, switching = false, frames = 0, fpsAt = performance.now(), fps = 0, lastError = "";
    const swap = (delegate: "GPU" | "CPU", variant: "full" | "lite") => {
      switching = true;
      createDetector(delegate, variant).then((nd) => { const old = detector.current; detector.current = nd; old?.close(); tried = 0; total = 0; switching = false; }).catch(() => { switching = false; });
    };
    const tick = () => {
      const v = videoRef.current, c = canvasRef.current, d = detector.current;
      if (!v || !c || !d || !stream.current) return;
      try {
        const now = performance.now();
        if (now - last >= 66 && v.videoWidth) {
          last = now; frames++; tried++; total++;
          if (now - fpsAt >= 1000) { fps = Math.round((frames * 1000) / (now - fpsAt)); frames = 0; fpsAt = now; }
          if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
          const lm = d.detect(v, now);
          if (lm) found = true;
          if (!switching) {
            if (!found && tried >= 45 && d.delegate === "GPU") swap("CPU", d.variant);          // GPU found nothing: try CPU
            else if (total >= 100 && fps > 0 && fps < 8 && d.variant === "full") swap(d.delegate, "lite"); // too slow: lighter model
          }
          const t = now - t0.current;
          const fr = analyzer.current.update(lm, t);
          const color = COLOR[fr.status];
          const ctx = c.getContext("2d")!;
          ctx.clearRect(0, 0, c.width, c.height);
          if (fr.smoothed) drawSkeleton(ctx, fr.smoothed, c.width, c.height, d.connections, color);
          lastDraw.current = { lm: fr.smoothed, color, status: fr.status, label: fr.position ? LABEL[fr.position] : "", tip: fr.issues[0]?.message ?? "" };
          if (phaseRef.current === "live") {
            for (const m of fr.moments) {
              moments.current.push({ ...m, photo: optsRef.current.photos ? snapshot(v, lastDraw.current, d.connections, t) : undefined });
              try { navigator.vibrate?.(120); } catch { /* not supported */ }
            }
            setElapsed(t);
          }
          const f = fr.features;
          const debug = `${d.variant}/${d.delegate} · ${lm ? "body found" : "no body"} · ${fps} fps${f ? ` · torso ${Math.round(f.torso)}° knee ${Math.round(f.knee)}° hip-height ${f.hipHeight.toFixed(1)}` : ""}${lastError ? " · " + lastError : ""}`;
          const next: Ui = { position: fr.position, warnings: fr.warnings, tip: fr.issues[0]?.message ?? "", note: fr.note, status: fr.status, reliable: fr.reliable, debug };
          const key = JSON.stringify(next);
          if (key !== lastUi.current) { lastUi.current = key; setUi(next); }
        }
        const rc = recCanvas.current;
        if (rc && phaseRef.current === "live" && v.videoWidth) paintFrame(rc.getContext("2d")!, v, rc.width, rc.height, lastDraw.current, d.connections, now - t0.current);
      } catch (e) { lastError = "error: " + (e as Error).message; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  const startCamera = async () => {
    setErr(""); setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: opts.facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      setPhase("setup"); setLoadingModel(true);
      await new Promise((r) => setTimeout(r, 80));
      const v = videoRef.current!; v.srcObject = stream.current; v.muted = true; v.playsInline = true; await v.play();
      detector.current ??= await createDetector("GPU", "full");
      analyzer.current.reset(); t0.current = performance.now(); lastUi.current = "";
      setLoadingModel(false); loop();
    } catch (e) {
      stopCamera(); setLoadingModel(false);
      const n = (e as Error).name;
      setErr(n === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser settings and try again."
        : n === "NotFoundError" ? "No camera was found on this device."
        : (e as Error).message === "unsupported" ? "This browser can’t open the camera. Use a recent Chrome, Safari or Edge, over HTTPS."
        : "The pose model couldn’t be loaded. Check your connection and try again. (" + (e as Error).message + ")");
      setPhase("intro");
    } finally { setBusy(false); }
  };

  const begin = () => {
    analyzer.current.reset(); t0.current = performance.now(); moments.current = []; chunks.current = []; setElapsed(0);
    recCanvas.current = null; recorder.current = null;
    const v = videoRef.current;
    if (opts.video && v && v.videoWidth && typeof MediaRecorder !== "undefined") {
      try {
        // Record a canvas that already contains the skeleton and the mistake messages, not the bare camera.
        const rc = document.createElement("canvas");
        rc.width = Math.min(960, v.videoWidth); rc.height = Math.round((rc.width * v.videoHeight) / v.videoWidth);
        recCanvas.current = rc;
        const mime = pickMime();
        const r = new MediaRecorder(rc.captureStream(30), mime ? { mimeType: mime } : undefined);
        r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
        r.start(1000); recorder.current = r;
      } catch { recorder.current = null; recCanvas.current = null; }
    }
    setPhase("live");
  };

  const finish = async () => {
    const t = performance.now() - t0.current;
    const summary = analyzer.current.getSummary(t);
    const r = recorder.current;
    if (r && r.state !== "inactive") await new Promise<void>((res) => { r.onstop = () => res(); r.stop(); });
    stopCamera();
    let videoUrl: string | undefined, ext = "webm";
    if (r && chunks.current.length) {
      const type = r.mimeType || "video/webm"; ext = type.includes("mp4") ? "mp4" : "webm";
      videoUrl = URL.createObjectURL(new Blob(chunks.current, { type })); urlRef.current = videoUrl;
    }
    recorder.current = null; recCanvas.current = null;
    setReview({ summary, moments: [...moments.current], videoUrl, ext });
    updateProgress((p) => ({ ...p, sessions: [...p.sessions, { id: String(Date.now()), kind: "salah-vision", at: Date.now(), seconds: Math.round(t / 1000), note: `${summary.momentCount} moments to review` }] }));
    setPhase("review");
  };

  const discard = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = undefined; moments.current = []; chunks.current = []; setReview(null); setPhase("intro"); };
  const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen?.().catch(() => {}); };
  const watch = (t: number) => { const v = reviewVideo.current; if (!v) return; v.currentTime = Math.max(0, t / 1000 - 2); v.play().catch(() => {}); v.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const fixDuration = (v: HTMLVideoElement) => { if (v.duration === Infinity) { v.currentTime = 1e101; v.ontimeupdate = () => { v.ontimeupdate = null; v.currentTime = 0; }; } };

  const showCamera = phase === "setup" || phase === "live";
  const ready = ui.reliable && ui.warnings.length === 0;
  const issue = phase === "live" && ui.status === "issue";

  return (
    <>
      <div className={showCamera ? "fixed inset-0 z-50 flex flex-col bg-black text-white" : "hidden"} role="dialog" aria-label="Salah Vision camera">
        <div className="relative min-h-0 flex-1">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-contain" playsInline muted aria-label="Camera preview" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-contain" aria-hidden="true" />
          {issue && <div className="pointer-events-none absolute inset-0 ring-8 ring-inset ring-red-500/80" aria-hidden="true" />}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]" aria-live="polite">
            <div className="min-w-0 flex-1">
              {loadingModel ? <p className="font-semibold">Loading the pose model…</p>
                : ui.warnings.length > 0 ? <ul className="list-disc space-y-1 pl-5 text-sm">{ui.warnings.map((w) => <li key={w.id}>{w.message}</li>)}</ul>
                : <p className="text-lg font-bold">{ui.position ? LABEL[ui.position] : phase === "setup" ? "Your body is visible. Ready when you are." : "Looking for your position…"}</p>}
              {phase === "live" && ui.position === "sujud" && <p className="mt-1 text-xs text-white/80">The camera can’t confirm all seven points. Check them yourself.</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {phase === "live" && <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold">● {fmt(elapsed)}</span>}
              <button className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur" onClick={toggleFs}>Full screen</button>
              <button className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur" onClick={() => { stopCamera(); setPhase("intro"); }} aria-label="Close camera">✕</button>
            </div>
          </div>

          {issue && ui.tip && <div className="absolute inset-x-4 top-24 rounded-xl bg-red-600/90 p-4 text-base font-semibold shadow-lg" role="status">{ui.tip}</div>}
          {!issue && ui.status === "unknown" && ui.note && phase === "live" && <div className="absolute inset-x-4 top-24 rounded-xl bg-amber-500/90 p-3 text-sm font-semibold text-black shadow-lg" role="status">{ui.note}</div>}
        </div>

        <div className="bg-black/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span><span className="text-green-400">●</span> Green: looks fine</span>
            <span><span className="text-red-400">●</span> Red: may need attention</span>
            <span><span className="text-amber-400">●</span> Amber: position not recognised</span>
          </div>
          <p className="mb-2 text-[11px] text-white/50">{ui.debug || "Starting…"}</p>
          <div className="flex flex-wrap gap-3">
            {phase === "setup" && <button className="btn btn-primary" onClick={begin} disabled={loadingModel || !ready}>{ready ? "Begin practice" : "Waiting for a clear view"}</button>}
            {phase === "setup" && !ready && !loadingModel && <button className="btn btn-ghost !bg-white/10 !text-white" onClick={begin}>Start anyway</button>}
            {phase === "live" && <button className="btn btn-primary" onClick={finish}>Finish and review</button>}
          </div>
        </div>
      </div>

      <div className="container-page max-w-4xl py-12">
        <h1 className="h-display">Salah Vision</h1>
        <p className="mt-3 max-w-prose text-lg text-muted">Practise your prayer positions with a live skeleton, then review the moments that may need attention.</p>
        <p className="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm">Use this to practise outside of prayer. During your actual salah, put your device away and focus on Allah. This is a learning aid, not a ruling on whether a prayer is valid.</p>
        {err && <p role="alert" className="mt-5 rounded-xl border border-red-400 bg-red-500/10 p-4 text-sm">{err}</p>}

        {phase === "intro" && (
          <div className="mt-8 grid gap-5">
            <section className="card">
              <h2 className="text-xl font-bold">How it works</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
                <li>Place your phone or laptop so it sees your <strong className="text-ink">side</strong> (left or right), about 2 to 3 metres away, with your whole body in view. Do not face the camera.</li>
                <li>Make sure the room is well lit.</li>
                <li>Pray through the positions. The skeleton is <strong className="text-green-500">green</strong> when a position looks fine, <strong className="text-red-500">red</strong> when something may need attention (a photo is saved), and <strong className="text-amber-500">amber</strong> when it can’t tell what position you are in.</li>
                <li>Afterwards, review those moments as photos and, if you chose, a video that shows the skeleton and the messages.</li>
              </ol>
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">Privacy</h2>
              <p className="mt-2 text-muted">Everything runs on your device. Camera frames are never uploaded. Nothing is saved unless you download it, and you can delete everything at the end. The camera turns off when you finish.</p>
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">What it can and cannot do</h2>
              <p className="mt-2 text-muted">One camera cannot see everything. It can recognise standing, bowing, prostration and sitting, and notice things like a raised back or bent knees in ruku. It cannot confirm all seven points of sujud, finger or hand details, or recitation. It is a guide for practice, so check anything important with a teacher.</p>
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">Choose how to review</h2>
              <label className="mt-3 flex items-start gap-3"><input type="checkbox" className="mt-1" checked={opts.photos} onChange={(e) => setOpts({ ...opts, photos: e.target.checked })} /><span><strong>Photos of mistakes</strong> (recommended). A photo with the skeleton and the message for each moment that may need attention. Kept in memory only.</span></label>
              <label className="mt-3 flex items-start gap-3"><input type="checkbox" className="mt-1" checked={opts.video} onChange={(e) => setOpts({ ...opts, video: e.target.checked })} /><span><strong>Record a video with the skeleton</strong>. The video shows your skeleton in colour and a red message at each mistake. Kept on this device only, and you can delete it.</span></label>
              <label className="mt-4 flex items-center gap-3 text-sm">Camera
                <select className="rounded-lg border border-line bg-surface px-3 py-2" value={opts.facing} onChange={(e) => setOpts({ ...opts, facing: e.target.value as "user" | "environment" })}>
                  <option value="user">Front camera or laptop webcam</option><option value="environment">Rear camera</option>
                </select>
              </label>
              <button className="btn btn-primary mt-6" onClick={startCamera} disabled={busy}>{busy ? "Starting camera…" : "Turn on camera"}</button>
            </section>
          </div>
        )}

        {phase === "review" && review && (
          <div className="mt-8 grid gap-6">
            <section className="card">
              <h2 className="text-xl font-bold">Session summary</h2>
              <p className="mt-2 text-muted">Practised for {fmt(review.summary.durationMs)}. The tool could track you clearly for {Math.round(review.summary.reliability * 100)}% of the time. {review.moments.length} moment{review.moments.length === 1 ? "" : "s"} to look at.</p>
              {review.summary.positions.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-sm">{review.summary.positions.map((p) => <li key={p.position}>{LABEL[p.position]}: {fmt(p.ms)}</li>)}</ul>
              ) : <p className="mt-3 text-sm text-muted">No positions were recognised with enough confidence. Try a clearer side view with better lighting.</p>}
              {review.summary.sequence.length > 0 && <p className="mt-3 text-sm text-muted">Order seen: {review.summary.sequence.map((p) => LABEL[p].split(" (")[0]).join(" → ")}</p>}
              <p className="mt-3 text-sm text-muted">This measures practice, not whether a prayer is valid.</p>
            </section>

            {review.videoUrl && (
              <section>
                <h2 className="text-xl font-bold">Your recording</h2>
                <p className="mt-1 text-sm text-muted">The skeleton and the mistake messages are part of the video. Tap a moment to jump to it.</p>
                <video ref={reviewVideo} src={review.videoUrl} controls playsInline className="mt-3 w-full rounded-2xl bg-black" onLoadedMetadata={(e) => fixDuration(e.currentTarget)} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.moments.map((m, i) => <button key={i} className="rounded-full border border-red-400 px-3 py-1 text-sm font-semibold text-red-500" onClick={() => watch(m.t)}>{fmt(m.t)}</button>)}
                  <a className="btn btn-ghost !py-1.5" href={review.videoUrl} download={`noor-path-session.${review.ext}`}>Download video</a>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold">Moments to look at</h2>
              {review.moments.length === 0 ? (
                <p className="card mt-3 text-muted">Nothing was flagged. That doesn’t guarantee your positions were perfect, since the camera can’t see everything. A teacher can give you the best feedback.</p>
              ) : (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {review.moments.map((m, i) => (
                    <article key={i} className="card !p-4">
                      {m.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.photo} alt={`Moment at ${fmt(m.t)} during ${LABEL[m.position]}: ${m.message}`} className="w-full rounded-xl" /> : <div className="rounded-xl bg-line p-6 text-center text-sm text-muted">No photo taken</div>}
                      <p className="mt-3 text-sm font-semibold text-muted">{fmt(m.t)} · {LABEL[m.position]}</p>
                      <p className="mt-1">{m.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.videoUrl && <button className="btn btn-ghost !py-1.5" onClick={() => watch(m.t)}>Watch in video</button>}
                        {m.photo && <a className="btn btn-ghost !py-1.5" href={m.photo} download={`noor-path-moment-${i + 1}.jpg`}>Download photo</a>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <div><button className="btn btn-primary" onClick={discard}>Delete session and practise again</button></div>
          </div>
        )}
      </div>
    </>
  );
}