"use client";
import Link from "next/link";
import { lessons } from "@/content/lessons";
import { useProgress } from "@/lib/storage/progress";

export function Dashboard() {
  const p = useProgress();
  const done = lessons.filter((l) => p.completed[l.id]).length;
  const next = lessons.find((l) => !p.completed[l.id]);
  const last = p.last ? lessons.find((l) => l.id === p.last!.id) : undefined;
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <section className="card" aria-labelledby="cont">
        <h2 id="cont" className="text-sm font-semibold text-muted">Continue learning</h2>
        {last ? (<><p className="mt-3 text-xl font-bold">{last.title}</p><Link className="btn btn-primary mt-5" href={`/learn/${last.id}`}>Resume lesson</Link></>)
          : (<><p className="mt-3 text-muted">You haven’t opened a lesson yet.</p><Link className="btn btn-primary mt-5" href="/learn">Browse lessons</Link></>)}
      </section>
      <section className="card" aria-labelledby="rec">
        <h2 id="rec" className="text-sm font-semibold text-muted">Recommended next step</h2>
        {next ? (<><p className="mt-3 text-xl font-bold">{next.title}</p><p className="mt-1 text-sm text-muted">{next.summary}</p><Link className="btn btn-ghost mt-5" href={`/learn/${next.id}`}>Start</Link></>)
          : (<p className="mt-3 text-muted">You have finished every lesson that is available right now. More are on the way.</p>)}
      </section>
      <section className="card" aria-labelledby="ov">
        <h2 id="ov" className="text-sm font-semibold text-muted">Your progress</h2>
        <p className="mt-3 text-xl font-bold">{done} of {lessons.length} lessons</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true"><div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${(done / lessons.length) * 100}%` }} /></div>
        <p className="mt-3 text-sm text-muted">Saved on this device only.</p>
      </section>
    </div>
  );
}
