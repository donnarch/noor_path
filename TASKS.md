# TASKS

## Phase 1: Foundation (done in v0.1, verified by typecheck, unit tests and production build; not yet checked in a real browser or on a phone)
- [x] Next.js 14 + TypeScript strict + Tailwind, design tokens, light/dark mode
- [x] Logo, favicon, responsive header/footer, skip link, focus styles, reduced-motion support
- [x] Homepage: welcome, Gregorian + Hijri date, continue learning, recommended next step, progress overview
- [x] 3D star hero with WebGL check and SVG fallback
- [x] Local storage architecture: zod-validated progress, IndexedDB helpers, export / import / reset / delete-all
- [x] Lessons: wudu, prayer positions (marked needs_review, no sources yet)
- [x] Privacy page, security headers, `.env.example`, `.gitignore`
- [ ] Open in a browser: check layout, 3D rendering, Arabic font rendering, mobile menu
- [ ] Brand polish: refined logo, loading screen, page transitions
- [ ] Daily knowledge / vocabulary / verified verse (needs verified content)

## Phase 2: Salah experience (next)
- [ ] Rigged GLB instructor (needs a licensed model; otherwise procedural model)
- [ ] Animation clips for each position, camera presets, speed, scrubbing
- [ ] Guided practice and test mode
- [ ] Wudu academy (animations, quiz), ghusl, tayammum
- [ ] Reviewer sign-off on prayer content, school differences

## Phase 3: Salah Vision (v0.2: first version written, unit-tested with synthetic poses, NOT yet tested with a real camera)
- [x] MediaPipe wrapper, camera flow, skeleton overlay, smoothing, setup checks
- [x] Position recognition (standing, ruku, sujud, sitting) with hold time and majority vote
- [x] Rules: raised back / low shoulders / bent knees in ruku, leaning when standing or sitting, low hips in sujud
- [x] Moments: photo with skeleton per mistake (and optional video with jump-to-moment), summary, delete
- [ ] REAL-DEVICE TESTING (phone + laptop, several people, rooms, distances) and threshold tuning
- [ ] Separate jalsa vs tashahhud by sequence; i'tidal vs qiyam; takbir hand check
- [ ] Reference 3D instructor comparison; worker-based inference if needed; offline model caching
- [ ] Teacher review of every rule and message
- [ ] `@mediapipe/tasks-vision` with model hosted in `public/models`
- [ ] Camera permission flow, setup checks, skeleton overlay, smoothing
- [ ] Position recognition state machine, configurable thresholds, synthetic fixtures for tests
- [ ] Reference comparison, practice summaries, optional local recording
- [ ] Test on real phones over HTTPS

## Phase 4: Quran (needs QF credentials in `.env.local`)
- [ ] Read https://api-docs.quran.foundation/ first; backend OAuth2 client-credentials with token cache
- [ ] Chapters, verses, translations, audio, bookmarks, memorization
- [ ] Show an honest pre-live limitation notice (Al-Fatiha and Al-Baqarah only)

## Phases 5-8
Arabic studio, dua library, knowledge explorer, tools (prayer times, qibla, tasbih, zakat), Ask Noor (Gemini, server-side), localization, PWA, SEO, accessibility audit, e2e tests.
