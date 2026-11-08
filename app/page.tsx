import Link from "next/link";
import { HeroVisual } from "@/components/3d/HeroVisual";
import { Welcome } from "@/components/home/Welcome";
import { Dashboard } from "@/components/home/Dashboard";

const AREAS: { t: string; d: string; ar: string; href?: string }[] = [
  { t: "Learn", d: "Wudu and prayer, step by step", ar: "علم", href: "/learn" },
  { t: "Salah Vision", d: "Camera practice with a live skeleton", ar: "رؤية", href: "/salah-vision" },
  { t: "My progress", d: "Your lessons, backup and data", ar: "تقدم", href: "/progress" },
  { t: "Privacy", d: "What is stored and where", ar: "خصوصية", href: "/privacy" },
  { t: "Quran", d: "Reader, audio and memorization", ar: "قرآن" },
  { t: "Arabic Studio", d: "Letters, vowels and pronunciation", ar: "حروف" },
  { t: "Dua Library", d: "Verified daily supplications", ar: "دعاء" },
  { t: "Prayer times", d: "For your location", ar: "مواقيت" },
  { t: "Qibla", d: "Direction of the Kaaba", ar: "قبلة" },
  { t: "Tasbih", d: "A saved dhikr counter", ar: "تسبيح" },
];
const TRUST = ["No account needed", "Camera stays on your device", "Content marked until reviewed"];

export default function Home() {
  return (
    <div className="container-page">
      <section className="grid items-center gap-12 py-14 md:grid-cols-[1.15fr_.85fr] md:py-24">
        <div className="animate-fade-up">
          <span className="badge">Learn · Practise · Understand · Grow</span>
          <div className="mt-5"><Welcome /></div>
          <h1 className="h-display mt-2">Assalamu <span className="text-gradient">Alaikum.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">Learn to pray, understand what you recite and practise with a live skeleton that helps you notice your posture. At your own pace, and with nobody judging you.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/learn" className="btn btn-primary">Start learning</Link>
            <Link href="/salah-vision" className="btn btn-ghost">Try Salah Vision</Link>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {TRUST.map((t) => <li key={t} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald/15 text-xs text-emerald">✓</span>{t}</li>)}
          </ul>
        </div>
        <HeroVisual />
      </section>

      <Dashboard />

      <section className="mt-24 overflow-hidden rounded-[2rem] border border-line bg-surface/70 shadow-soft md:grid md:grid-cols-2" aria-labelledby="sv">
        <div className="relative min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/noor-path-hero.webp" alt="A man sitting in prayer with a glowing skeleton drawn over his body, in front of a mosque at night" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface/40" aria-hidden="true" />
        </div>
        <div className="p-8 sm:p-12">
          <span className="badge">Salah Vision</span>
          <h2 id="sv" className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Practise with a <span className="text-gradient">live skeleton</span></h2>
          <p className="mt-4 text-muted">Turn on your camera, stand so it sees your side, and pray through the positions. The skeleton turns red when something may need attention, and you can review each moment afterwards as a photo or video.</p>
          <ol className="mt-6 grid gap-3 text-sm">
            {["Turn on the camera. Everything stays on your device.", "Pray through the positions. Red means look at this.", "Review the moments, and ask your teacher about them."].map((s, n) => (
              <li key={s} className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue text-xs font-bold text-white">{n + 1}</span><span className="pt-0.5">{s}</span></li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted">A learning aid for practice outside of prayer. It cannot see everything and is not a ruling.</p>
          <Link href="/salah-vision" className="btn btn-primary mt-7">Open Salah Vision</Link>
        </div>
      </section>

      <section className="mt-24" aria-labelledby="qa">
        <h2 id="qa" className="text-3xl font-extrabold tracking-tight">Everything in Noor Path</h2>
        <p className="mt-2 text-muted">Items marked “Planned” are not available yet.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((a) => {
            const inner = (
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue/15 to-emerald/15 font-arabic text-2xl text-blue">{a.ar}</span>
                <div>
                  <h3 className="flex items-center gap-2 font-bold">{a.t}{!a.href && <span className="badge">Planned</span>}</h3>
                  <p className="mt-1 text-sm text-muted">{a.d}</p>
                </div>
              </div>
            );
            return a.href
              ? <Link key={a.t} href={a.href} className="card card-hover">{inner}</Link>
              : <div key={a.t} className="card opacity-60" aria-disabled="true">{inner}</div>;
          })}
        </div>
      </section>
    </div>
  );
}