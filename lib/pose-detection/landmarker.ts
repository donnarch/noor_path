import type { Landmark } from "@/lib/pose-analysis/types";

export type Variant = "full" | "lite";
export interface Detector {
  detect(video: HTMLVideoElement, t: number): Landmark[] | null;
  connections: { start: number; end: number }[];
  delegate: "GPU" | "CPU";
  variant: Variant;
  close(): void;
}
const BASE = "https://storage.googleapis.com/mediapipe-models/pose_landmarker";
const MODELS: Record<Variant, { local: string; remote: string }> = {
  full: { local: "/models/pose_landmarker_full.task", remote: `${BASE}/pose_landmarker_full/float16/1/pose_landmarker_full.task` },
  lite: { local: "/models/pose_landmarker_lite.task", remote: `${BASE}/pose_landmarker_lite/float16/1/pose_landmarker_lite.task` },
};

/** Prefer a model hosted with the site (public/models); fall back to Google's official URL. */
async function modelUrl(v: Variant): Promise<string> {
  const { local, remote } = MODELS[v];
  try { const r = await fetch(local, { method: "HEAD" }); if (r.ok && Number(r.headers.get("content-length") ?? 1) > 1000) return local; } catch { /* use remote */ }
  return remote;
}

/** The "full" model is more accurate than "lite" and is the default. */
export async function createDetector(preferred: "GPU" | "CPU" = "GPU", variant: Variant = "full"): Promise<Detector> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const modelAssetPath = await modelUrl(variant);
  const make = (delegate: "GPU" | "CPU") =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath, delegate }, runningMode: "VIDEO", numPoses: 1,
      minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
  let delegate = preferred;
  let pl: Awaited<ReturnType<typeof make>>;
  try { pl = await make(preferred); } catch { delegate = "CPU"; pl = await make("CPU"); }
  let last = -1;
  return {
    delegate, variant,
    connections: PoseLandmarker.POSE_CONNECTIONS,
    detect(video, t) {
      if (video.readyState < 2 || video.videoWidth === 0) return null;
      if (t <= last) t = last + 1;
      last = t;
      const lm = pl.detectForVideo(video, t).landmarks?.[0];
      return lm ? lm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility })) : null;
    },
    close() { pl.close(); },
  };
}