"use client";
import { useEffect, useState } from "react";
import { LETTERS } from "@/content/letters";

type Tab = "letters" | "vowels" | "quiz";
/** These six letters never join to the letter after them, so they have no initial or medial form. */
const NON_JOINERS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);
const ZWJ = "\u200D"; // zero-width joiner: makes the font show the joined form of a letter
const VOWELS = [
  { m: "بَ", n: "Fatha", d: "A short ‘a’ sound, as in ba" }, { m: "بِ", n: "Kasra", d: "A short ‘i’ sound, as in bi" },
  { m: "بُ", n: "Damma", d: "A short ‘u’ sound, as in bu" }, { m: "بْ", n: "Sukoon", d: "No vowel: the letter stops" },
  { m: "بّ", n: "Shadda", d: "Doubles the letter" }, { m: "بً", n: "Tanween", d: "Adds an ‘n’ sound at the end of a word, as in ban" },
];

export default function ArabicStudio() {
  const [tab, setTab] = useState<Tab>("letters");
  const [sel, setSel] = useState(0);
  const [learned, setLearned] = useState<number[]>([]);
  useEffect(() => { try { const r = localStorage.getItem("noorpath:letters"); if (r) setLearned(JSON.parse(r)); } catch { /* ignore */ } }, []);
  const save = (l: number[]) => { setLearned(l); try { localStorage.setItem("noorpath:letters", JSON.stringify(l)); } catch { /* ignore */ } };
  const L = LETTERS[sel], joins = !NON_JOINERS.has(L.ch), done = learned.includes(sel);
  const forms = [
    { n: "Alone", s: L.ch }, ...(joins ? [{ n: "Start", s: L.ch + ZWJ }, { n: "Middle", s: ZWJ + L.ch + ZWJ }] : []), { n: "End", s: ZWJ + L.ch },
  ];
  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="h-display">Arabic <span className="text-gradient">Studio</span></h1>
      <p className="mt-4 max-w-prose text-lg text-muted">Learn the 28 letters, how they change shape inside a word, and the marks that give them sounds.</p>
      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Arabic Studio">
        {([["letters", "Letters"], ["vowels", "Vowel marks"], ["quiz", "Quiz"]] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${tab === id ? "border-blue bg-blue text-white shadow-soft" : "border-line bg-surface/70 text-muted hover:text-ink"}`}>{l}</button>
        ))}
      </div>

      {tab === "letters" && (
        <div className="mt-8 grid gap-6">
          <div className="card grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <div className="grid h-48 w-48 place-items-center rounded-3xl bg-gradient-to-br from-blue/15 to-emerald/15 font-arabic text-[8rem] leading-none text-blue" aria-label={`The letter ${L.name}`}>{L.ch}</div>
            <div>
              <h2 className="text-3xl font-extrabold">{L.name}</h2>
              <p className="mt-1 text-sm text-muted">{joins ? "This letter joins to the letter after it." : "This letter does not join to the letter after it, so it has only two forms."}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {forms.map((f) => <div key={f.n} className="rounded-2xl border border-line bg-surface p-3 text-center"><p className="font-arabic text-4xl leading-tight">{f.s}</p><p className="text-xs text-muted">{f.n}</p></div>)}
              </div>
              <button className={`btn mt-5 ${done ? "btn-ghost" : "btn-primary"}`} onClick={() => save(done ? learned.filter((x) => x !== sel) : [...learned, sel])} aria-pressed={done}>{done ? "Learned. Tap to undo" : "Mark as learned"}</button>
            </div>
          </div>
          <p className="text-sm text-muted">{learned.length} of 28 letters learned. Audio for each sound will come from verified reciters, not computer voices.</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {LETTERS.map((l, i) => (
              <button key={l.name} onClick={() => setSel(i)} aria-label={l.name} aria-pressed={i === sel}
                className={`relative aspect-square rounded-2xl border font-arabic text-3xl transition-colors ${i === sel ? "border-blue bg-blue/10 shadow-soft" : "border-line bg-surface hover:border-blue/60"}`}>
                {l.ch}{learned.includes(i) && <span className="absolute right-1.5 top-1 font-sans text-xs text-emerald">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "vowels" && (
        <div className="mt-8">
          <p className="text-muted">Short marks above or below a letter tell you how to say it. Here they are on the letter Ba.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VOWELS.map((v) => <div key={v.n} className="card text-center"><p className="font-arabic text-6xl leading-tight text-blue">{v.m}</p><h3 className="mt-2 text-lg font-bold">{v.n}</h3><p className="text-sm text-muted">{v.d}</p></div>)}
          </div>
        </div>
      )}

      {tab === "quiz" && <Quiz />}
    </div>
  );
}

function Quiz() {
  const [q, setQ] = useState<{ i: number; opts: number[] } | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const [answer, setAnswer] = useState<number | null>(null);
  const next = () => {
    const i = Math.floor(Math.random() * 28), opts = [i];
    while (opts.length < 4) { const r = Math.floor(Math.random() * 28); if (!opts.includes(r)) opts.push(r); }
    setQ({ i, opts: opts.sort(() => Math.random() - 0.5) }); setAnswer(null);
  };
  useEffect(next, []);
  if (!q) return null;
  const pick = (x: number) => { if (answer !== null) return; setAnswer(x); setScore((s) => ({ ok: s.ok + (x === q.i ? 1 : 0), n: s.n + 1 })); };
  return (
    <div className="card mt-8 text-center">
      <p className="text-sm text-muted">Which letter is this? Score: {score.ok} of {score.n}</p>
      <p className="my-4 font-arabic text-[8rem] leading-none text-blue">{LETTERS[q.i].ch}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {q.opts.map((o) => {
          const right = answer !== null && o === q.i, wrong = answer === o && o !== q.i;
          return <button key={o} onClick={() => pick(o)} disabled={answer !== null} className={`rounded-2xl border px-5 py-3 font-semibold transition-colors ${right ? "border-emerald bg-emerald/15" : wrong ? "border-red-400 bg-red-500/10" : "border-line bg-surface"}`}>{LETTERS[o].name}</button>;
        })}
      </div>
      <p className="mt-4 min-h-[1.5rem]" role="status" aria-live="polite">{answer === null ? "" : answer === q.i ? "Correct!" : `Not quite. This is ${LETTERS[q.i].name}.`}</p>
      {answer !== null && <button className="btn btn-primary mt-2" onClick={next} autoFocus>Next letter</button>}
    </div>
  );
}