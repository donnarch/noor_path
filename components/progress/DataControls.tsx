"use client";
import { useEffect, useRef, useState } from "react";
import { lessons } from "@/content/lessons";
import { deleteAllData, exportProgress, importProgress, resetProgress, useProgress } from "@/lib/storage/progress";
import { getHijriOffset, hijriDate, setHijriOffset } from "@/lib/hijri";

export function DataControls() {
  const p = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [off, setOff] = useState(0);
  useEffect(() => setOff(getHijriOffset()), []);
  const done = lessons.filter((l) => p.completed[l.id]);
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "noor-path-progress.json"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="grid gap-6">
      <section className="card">
        <h2 className="text-lg font-bold">Lessons</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {lessons.map((l) => <li key={l.id} className="flex justify-between gap-3"><span>{l.title}</span><span className="text-muted">{p.completed[l.id] ? "Completed " + new Date(p.completed[l.id]).toLocaleDateString() : "Not completed"}</span></li>)}
        </ul>
        <p className="mt-4 text-sm text-muted">{done.length} of {lessons.length} completed. Practice sessions recorded: {p.sessions.length}.</p>
      </section>
      <section className="card">
        <h2 className="text-lg font-bold">Hijri date adjustment</h2>
        <p className="mt-1 text-sm text-muted">Moon sighting differs between regions. Adjust by up to two days.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select className="rounded-lg border border-line bg-surface px-3 py-2" value={off} aria-label="Hijri date adjustment in days"
            onChange={(e) => { const n = +e.target.value; setOff(n); setHijriOffset(n); }}>
            {[-2, -1, 0, 1, 2].map((n) => <option key={n} value={n}>{n > 0 ? `+${n}` : n} days</option>)}
          </select>
          <span className="text-sm">{hijriDate(new Date(), off)} AH</span>
        </div>
      </section>
      <section className="card">
        <h2 className="text-lg font-bold">Your data</h2>
        <p className="mt-1 text-sm text-muted">Everything is stored in this browser on this device. Export a backup to move it elsewhere.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={download}>Export progress</button>
          <button className="btn btn-ghost" onClick={() => file.current?.click()}>Import progress</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setMsg(importProgress(await f.text()) ? "Progress imported." : "That file isn’t a valid Noor Path backup, so nothing was changed.");
            e.target.value = "";
          }} />
          <button className="btn btn-ghost" onClick={() => { if (confirm("Reset all learning progress?")) { resetProgress(); setMsg("Progress reset."); } }}>Reset progress</button>
          <button className="btn btn-ghost !border-red-400 !text-red-500" onClick={async () => { if (confirm("Delete all Noor Path data from this browser? This cannot be undone.")) { await deleteAllData(); setMsg("All data deleted."); } }}>Delete all data</button>
        </div>
        <p className="mt-3 min-h-[1.25rem] text-sm" role="status" aria-live="polite">{msg}</p>
      </section>
    </div>
  );
}
