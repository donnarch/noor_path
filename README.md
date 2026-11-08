# Noor Path

Learn. Practise. Understand. Grow. A Next.js (App Router) + TypeScript + Tailwind learning platform. No accounts: all progress is stored locally in the browser.

## Run locally
```bash
npm install
cp .env.example .env.local   # add real keys later; never commit this file
npm run dev                  # http://localhost:3000
npm run typecheck && npm test && npm run build
```

## Deploy
Push to GitHub and import the repo in Vercel. Add the variables from `.env.example` in the Vercel project settings (server-side only).

## What exists in v0.1 (Phase 1)
Responsive layout, light/dark theme, brand mark and favicon, interactive 3D geometric star (WebGL with a flat SVG fallback), personal dashboard, two lessons (wudu, prayer positions), local progress with export / import / reset / delete-all (localStorage + IndexedDB layer), Hijri date with manual adjustment, privacy page, unit tests.

## Salah Vision (v0.2)
Route `/salah-vision`. Live camera, skeleton overlay (MediaPipe Pose Landmarker, lite model, on-device), position recognition (standing, bowing, prostration, sitting), gentle observations, and a review screen with a photo of each moment plus an optional recorded video you can jump into.
- `npm install` copies the MediaPipe wasm into `public/mediapipe/wasm` and tries to download the model to `public/models/`. If the download fails, run `npm run fetch-model`; otherwise the app loads the model from Google's official URL at runtime.
- Camera needs HTTPS (localhost is fine for development). Test on a real phone.
- Logic lives in `lib/pose-analysis` (pure TypeScript, unit-tested with synthetic poses), `lib/pose-detection` (MediaPipe wrapper and drawing) and `features/salah-vision` (UI). Thresholds are in `lib/pose-analysis/config.ts` and must be tuned with real recordings and reviewed by a teacher.

## Content rules
All religious content lives in `content/` with a review status. Everything is `needs_review` until a qualified reviewer approves it and adds sources. Never publish unreviewed or AI-generated religious text, and never type Quran or dua Arabic from memory: fetch Quran text from Quran Foundation on the server.

## Not built yet
See `TASKS.md`. Notably: Quran Foundation integration, Salah Vision (MediaPipe), the 3D instructor, Gemini "Ask Noor", prayer times, PWA.
