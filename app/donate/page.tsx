import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Donate", description: "Ways to give to people in need through trusted organisations. Noor Path does not collect donations." };

const CAUSES = [
  {
    name: "Gaza relief and recovery",
    host: "pcrf1.app.neoncrm.com",
    url: "https://pcrf1.app.neoncrm.com/forms/gaza-relief--recovery-required-fields?campaignId=2561",
    text: "Support relief and recovery for people in Gaza. You will give on the organisation’s own donation form.",
  },
  {
    name: "Provide meals",
    host: "spotlighthumanity.com",
    url: "https://www.spotlighthumanity.com/meals-v2",
    text: "Help provide meals to people in need. The campaign page explains where the meals go.",
  },
];

export default function Donate() {
  return (
    <div className="container-page max-w-4xl py-12">
      <span className="badge">♥ Giving</span>
      <h1 className="h-display mt-4">Give to those <span className="text-gradient">in need</span></h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">Caring for people who are hungry, displaced or hurting is a central value in Islam. It shows in zakat, which is obligatory, and in sadaqah, which is voluntary and can be given at any time, in any amount. Learning your faith and acting on it belong together.</p>

      <div className="mt-8 rounded-3xl border-2 border-gold/60 bg-gold/10 p-6" role="note">
        <h2 className="text-xl font-bold">Noor Path does not collect donations</h2>
        <p className="mt-2 text-muted">We never take, hold or process any money. We do not earn anything when you give. If you would like to donate, use the links below. They take you to other organisations’ own websites, where you give directly to them.</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {CAUSES.map((c) => (
          <article key={c.url} className="card card-hover flex flex-col">
            <h2 className="text-2xl font-extrabold tracking-tight">{c.name}</h2>
            <p className="mt-3 flex-1 text-muted">{c.text}</p>
            <p className="mt-4 text-xs text-muted">Opens {c.host} in a new tab</p>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-3">Donate on their website ↗</a>
          </article>
        ))}
      </div>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Before you give</h2>
        <ul className="mt-3 grid gap-2 text-muted">
          <li>Check that the website address is the one you expect before entering any payment details.</li>
          <li>Look up any charity yourself: how it is registered, how it uses donations, and whether it fits your intentions.</li>
          <li>Noor Path is not affiliated with these organisations and cannot answer questions about their donations.</li>
          <li>If you are unsure how much zakat you owe, our <Link href="/tools" className="font-semibold text-blue underline">zakat calculator</Link> can help you estimate it, and a scholar can advise on your situation.</li>
        </ul>
      </section>
    </div>
  );
}