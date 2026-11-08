import type { Landmark } from "@/lib/pose-analysis/types";

export interface Detector {
  detect(video: HTMLVideoElement, t: number): Landmark[] | null;
  connections: { start: number; end: number }[];
  delegate: "GPU" | "CPU";
  close(): void;
}
const LOCAL = "/models/pose_landmarker_lite.task";
const REMOTE = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

/** Prefer the model hosted with the site (npm run fetch-model); fall back to Google's official URL. */
async function modelUrl(): Promise<string> {
  try { const r = await fetch(LOCAL, { method: "HEAD" }); if (r.ok && Number(r.headers.get("content-length") ?? 1) > 1000) return LOCAL; } catch { /* use remote */ }
  return REMOTE;
}

export async function createDetector(preferred: "GPU" | "CPU" = "GPU"): Promise<Detector> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const modelAssetPath = await modelUrl();
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
    delegate,
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