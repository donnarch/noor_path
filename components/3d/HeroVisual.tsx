"use client";
import { useEffect, useRef, useState } from "react";
import { LETTERS } from "@/content/letters";

const DEPTH = 14;

/** An Arabic letter with real 3D depth. Drag or hover to turn it, use the arrows to change letter. */
export function HeroVisual() {
  const [i, setI] = useState(24); // Noon, the first letter of "Noor"
  const glyph = useRef<HTMLDivElement>(null);
  const st = useRef({ hover: false, tx: 0, ty: 0 });
  const letter = LETTERS[i];

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let id = 0, rx = 0, ry = 0;
    const loop = (t: number) => {
      const s = st.current;
      const ty = s.hover ? s.ty : reduce ? 0 : Math.sin(t / 1200) * 22;
      const tx = s.hover ? s.tx : reduce ? 0 : Math.sin(t / 1700) * 7;
      ry += (ty - ry) * 0.1; rx += (tx - rx) * 0.1;
      if (glyph.current) glyph.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const layers = Array.from({ length: DEPTH + 1 }, (_, n) => DEPTH - n); // back to front
  const step = (d: number) => setI((v) => (v + d + LETTERS.length) % LETTERS.length);

  return (
    <div className="relative mx-auto w-full max-w-sm animate-fade-up">
      <div className="absolute -inset-8 rounded-full bg-sky/25 blur-3xl" aria-hidden="true" />
      <div className="arch pattern relative overflow-hidden border border-line bg-gradient-to-b from-surface to-surface/50 px-6 pb-6 pt-10 shadow-glow backdrop-blur">
        <div
          className="relative grid aspect-[4/4.3] cursor-grab touch-pan-y place-items-center active:cursor-grabbing"
          style={{ perspective: 900 }}
          onPointerMove={(e) => {
            const b = e.currentTarget.getBoundingClientRect();
            st.current = { hover: true, ty: ((e.clientX - b.left) / b.width - 0.5) * 90, tx: -((e.clientY - b.top) / b.height - 0.5) * 50 };
          }}
          onPointerLeave={() => { st.current.hover = false; }}
        >
          <div ref={glyph} className="relative h-56 w-56" style={{ transformStyle: "preserve-3d" }} role="img" aria-label={`The Arabic letter ${letter.name}`}>
            {layers.map((k) => (
              <span
                key={k}
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center font-arabic text-[11rem] font-bold leading-none"
                style={{
                  transform: `translateZ(${-k * 3}px)`,
                  color: k ? "rgb(var(--blue))" : "rgb(var(--sky))",
                  opacity: k ? 0.95 - k * 0.05 : 1,
                  textShadow: k ? "none" : "0 0 30px rgb(var(--sky) / .55)",
                }}
              >{letter.ch}</span>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button className="btn btn-ghost !px-4 !py-2" onClick={() => step(-1)} aria-label="Previous letter">←</button>
          <div className="text-center" aria-live="polite">
            <p className="text-lg font-bold">{letter.name}</p>
            <p className="text-xs text-muted">Drag to turn the letter</p>
          </div>
          <button className="btn btn-ghost !px-4 !py-2" onClick={() => step(1)} aria-label="Next letter">→</button>
        </div>
      </div>
    </div>
  );
}