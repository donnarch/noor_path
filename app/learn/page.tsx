import type { Metadata } from "next";
import Link from "next/link";
import { lessons } from "@/content/lessons";
import { STATUS_LABEL } from "@/content/schema";

export const metadata: Metadata = { title: "Learn", description: "Step-by-step lessons on wudu and prayer." };

export default function Learn() {
  return (
    <div className="container-page py-12">
      <h1 className="h-display">Learn</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">Pick a lesson. Each one is short, and your place is saved automatically.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {lessons.map((l) => (
          <Link key={l.id} href={`/learn/${l.id}`} className="card transition-colors hover:border-blue">
            <span className="badge">{l.topic}</span>
            <h2 className="mt-3 text-xl font-bold">{l.title}</h2>
            <p className="mt-1 text-muted">{l.summary}</p>
            <p className="mt-4 text-xs text-muted">{l.steps.length} steps · {STATUS_LABEL[l.status]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
