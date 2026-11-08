"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createDetector, type Detector } from "@/lib/pose-detection/landmarker";
import { drawSkeleton } from "@/lib/pose-detection/draw";
import { SalahAnalyzer } from "@/lib/pose-analysis/analyzer";
import type { Landmark, Moment, Position, Summary, Warning } from "@/lib/pose-analysis/types";
import { updateProgress } from "@/lib/storage/progress";

type Phase = "intro" | "setup" | "live" | "review";
interface ReviewMoment extends Moment { photo?: string }
interface Review { summary: Summary; moments: ReviewMoment[]; videoUrl?: string }
interface Ui { position: Position | null; warnings: Warning[]; tips: string[]; reliable: boolean; status: string }

const LABEL: Record<Position, string> = { standing: "Standing (qiyam)", ruku: "Bowing (ruku)", sujud: "Prostration (sujud)", sitting: "Sitting (jalsa or tashahhud)" };
const BLUE = "#38BDF8", RED = "#EF4444", GREY = "#9AA7BD";
const fmt = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function snapshot(v: HTMLVideoElement, lm: Landmark[] | null, conns: { start: number; end: number }[]) {
  const w = Math.min(640, v.videoWidth), h = Math.round((w * v.videoHeight) / v.videoWidth);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!; x.drawImage(v, 0, 0, w, h);
  if (lm) drawSkeleton(x, lm, w, h, conns, RED);
  return c.toDataURL("image/jpeg", 0.75);
}

export default function SalahVision() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [opts, setOpts] = useState({ photos: true, video: false, facing: "user" as "user" | "environment" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [ui, setUi] = useState<Ui>({ position: null, warnings: [], tips: [], reliable: false, status: "" });
  const [elapsed, setElapsed] = useState(0);
  const [review, setReview] = useState<Review | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reviewVideo = useRef<HTMLVideoElement>(null);
  const detector = useRef<Detector | null>(null);
  const analyzer = useRef(new SalahAnalyzer());
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const moments = useRef<ReviewMoment[]>([]);
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
    let last = 0, tried = 0, found = false, switching = false, frames = 0, fpsAt = performance.now(), fps = 0, lastError = "";
    const tick = () => {
      const v = videoRef.current, c = canvasRef.current, d = detector.current;
      if (!v || !c || !d || !stream.current) return;
      try {
        const now = performance.now();
        if (now - last >= 66 && v.videoWidth) {
          last = now; frames++; tried++;
          if (now - fpsAt >= 1000) { fps = Math.round((frames * 1000) / (now - fpsAt)); frames = 0; fpsAt = now; }
          if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
          const lm = d.detect(v, now);
          if (lm) found = true;
          // If the GPU delegate never finds a body, quietly switch to the CPU delegate.
          if (!found && tried >= 45 && d.delegate === "GPU" && !switching) {
            switching = true;
            createDetector("CPU").then((nd) => { const old = detector.current; detector.current = nd; old?.close(); tried = 0; switching = false; }).catch(() => { switching = false; });
          }
          const t = now - t0.current;
          const fr = analyzer.current.update(lm, t);
          const ctx = c.getContext("2d")!;
          ctx.clearRect(0, 0, c.width, c.height);
          const alert = fr.issues.length > 0;
          if (fr.smoothed) drawSkeleton(ctx, fr.smoothed, c.width, c.height, d.connections, alert ? RED : fr.reliable ? BLUE : GREY);
          if (phaseRef.current === "live") {
            for (const m of fr.moments) moments.current.push({ ...m, photo: optsRef.current.photos ? snapshot(v, fr.smoothed, d.connections) : undefined });
            setElapsed(t);
          }
          const status = `Tracking: ${d.delegate} · ${lm ? "body found" : "no body found yet"} · ${fps} fps${lastError ? " · " + lastError : ""}`;
          const next: Ui = { position: fr.position, warnings: fr.warnings, tips: fr.issues.map((i) => i.message), reliable: fr.reliable, status };
          const key = JSON.stringify(next);
          if (key !== lastUi.current) { lastUi.current = key; setUi(next); }
        }
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
      await new Promise((r) => setTimeout(r, 80)); // let the full-screen camera view appear before playing
      const v = videoRef.current!; v.srcObject = stream.current; v.muted = true; v.playsInline = true; await v.play();
      detector.current ??= await createDetector("GPU");
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
    if (opts.video && stream.current && typeof MediaRecorder !== "undefined") {
      try { const r = new MediaRecorder(stream.current); r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); }; r.start(1000); recorder.current = r; }
      catch { recorder.current = null; }
    }
    setPhase("live");
  };

  const finish = async () => {
    const t = performance.now() - t0.current;
    const summary = analyzer.current.getSummary(t);
    const r = recorder.current;
    if (r && r.state !== "inactive") await new Promise<void>((res) => { r.onstop = () => res(); r.stop(); });
    stopCamera();
    let videoUrl: string | undefined;
    if (r && chunks.current.length) { videoUrl = URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType || "video/webm" })); urlRef.current = videoUrl; }
    recorder.current = null;
    setReview({ summary, moments: [...moments.current], videoUrl });
    updateProgress((p) => ({ ...p, sessions: [...p.sessions, { id: String(Date.now()), kind: "salah-vision", at: Date.now(), seconds: Math.round(t / 1000), note: `${summary.momentCount} moments to review` }] }));
    setPhase("review");
  };

  const discard = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = undefined; moments.current = []; chunks.current = []; setReview(null); setPhase("intro"); };
  const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen?.().catch(() => {}); };
  const watch = (t: number) => { const v = reviewVideo.current; if (!v) return; v.currentTime = Math.max(0, t / 1000 - 2); v.play().catch(() => {}); v.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const fixDuration = (v: HTMLVideoElement) => { if (v.duration === Infinity) { v.currentTime = 1e101; v.ontimeupdate = () => { v.ontimeupdate = null; v.currentTime = 0; }; } };

  const showCamera = phase === "setup" || phase === "live";
  const ready = ui.reliable && ui.warnings.length === 0;
  const alert = phase === "live" && ui.tips.length > 0;

  return (
    <>
      {/* Full-screen camera view. The video and canvas stay mounted so the camera can attach before it is shown. */}
      <div className={showCamera ? "fixed inset-0 z-50 flex flex-col bg-black text-white" : "hidden"} role="dialog" aria-label="Salah Vision camera">
        <div className="relative min-h-0 flex-1">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-contain" playsInline muted aria-label="Camera preview" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-contain" aria-hidden="true" />
          {alert && <div className="pointer-events-none absolute inset-0 ring-8 ring-inset ring-red-500/80" aria-hidden="true" />}

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

          {alert && <div className="absolute inset-x-4 top-24 rounded-xl bg-red-600/90 p-4 text-base font-semibold shadow-lg" role="status">{ui.tips[0]}</div>}
        </div>

        <div className="bg-black/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-xs text-white/60">{ui.status || "Starting…"}</p>
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
                <li>Pray through the positions. A skeleton follows you. It turns <strong className="text-red-500">red</strong> when something may need attention, and a photo is saved.</li>
                <li>Afterwards, review those moments as photos and, if you chose, your video.</li>
              </ol>
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">Privacy</h2>
              <p className="mt-2 text-muted">Everything runs on your device. Camera frames are never uploaded. Nothing is saved unless you download it, and you can delete everything at the end. The camera turns off when you finish.</p>
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">What it can and cannot do</h2>
              <p className="mt-2 text-muted">One camera cannot see everything. It can recognise standing, bowing, prostration and sitting, and notice things like a raised back in ruku. It cannot confirm all seven points of sujud, hand placement or recitation. When tracking is poor, it says so and stays quiet.</p>
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">Choose how to review</h2>
              <label className="mt-3 flex items-start gap-3"><input type="checkbox" className="mt-1" checked={opts.photos} onChange={(e) => setOpts({ ...opts, photos: e.target.checked })} /><span><strong>Photos of moments</strong> (recommended). A photo with the skeleton for each moment that may need attention. Kept in memory only.</span></label>
              <label className="mt-3 flex items-start gap-3"><input type="checkbox" className="mt-1" checked={opts.video} onChange={(e) => setOpts({ ...opts, video: e.target.checked })} /><span><strong>Also record a video</strong> so you can watch each moment in context. Kept on this device only, and you can delete it.</span></label>
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
              <p className="mt-2 text-muted">Practised for {fmt(review.summary.durationMs)}. The tool could track you clearly for {Math.round(review.summary.reliability * 100)}% of the time.</p>
              {review.summary.positions.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-sm">{review.summary.positions.map((p) => <li key={p.position}>{LABEL[p.position]}: {fmt(p.ms)}</li>)}</ul>
              ) : <p className="mt-3 text-sm text-muted">No positions were recognised with enough confidence. Try a clearer side view with better lighting.</p>}
              {review.summary.sequence.length > 0 && <p className="mt-3 text-sm text-muted">Order seen: {review.summary.sequence.map((p) => LABEL[p].split(" (")[0]).join(" → ")}</p>}
              <p className="mt-3 text-sm text-muted">This measures practice, not whether a prayer is valid.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold">Moments to look at</h2>
              {review.moments.length === 0 ? (
                <p className="card mt-3 text-muted">Nothing stood out. That doesn’t guarantee your positions were perfect, since the camera can’t see everything. A teacher can give you the best feedback.</p>
              ) : (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {review.moments.map((m, i) => (
                    <article key={i} className="card !p-4">
                      {m.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.photo} alt={`Moment at ${fmt(m.t)} during ${LABEL[m.position]}`} className="w-full rounded-xl" /> : <div className="rounded-xl bg-line p-6 text-center text-sm text-muted">No photo taken</div>}
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
            {review.videoUrl && (
              <section>
                <h2 className="text-xl font-bold">Your recording</h2>
                <video ref={reviewVideo} src={review.videoUrl} controls playsInline className="mt-3 w-full rounded-2xl bg-black" onLoadedMetadata={(e) => fixDuration(e.currentTarget)} />
                <a className="btn btn-ghost mt-3" href={review.videoUrl} download="noor-path-session.webm">Download video</a>
              </section>
            )}
            <div><button className="btn btn-primary" onClick={discard}>Delete session and practise again</button></div>
          </div>
        )}
      </div>
    </>
  );
}