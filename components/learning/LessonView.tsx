"use client";
import { useEffect } from "react";
import type { Lesson } from "@/content/schema";
import { STATUS_LABEL } from "@/content/schema";
import { markLast, toggleComplete, useProgress } from "@/lib/storage/progress";

export function LessonView({ lesson }: { lesson: Lesson }) {
  const p = useProgress();
  const done = !!p.completed[lesson.id];
  useEffect(() => { markLast(lesson.id, lesson.title); }, [lesson.id, lesson.title]);
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="badge">{lesson.topic}</span>
        <span className="badge">{STATUS_LABEL[lesson.status]}</span>
        <span className="badge">{lesson.schools === "all" ? "Common to all schools" : lesson.schools.join(", ")}</span>
      </div>
      {lesson.status !== "approved" && (
        <p className="mt-5 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm">This lesson is waiting for review by a qualified teacher and does not list sources yet. Small details differ between schools of thought, so confirm them with your teacher or imam.</p>
      )}
      <ol className="mt-8 grid gap-4">
        {lesson.steps.map((s, i) => (
          <li key={s.title} className="card relative pl-16">
            <span className="absolute left-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-blue text-sm font-bold text-white">{i + 1}</span>
            <h2 className="text-lg font-bold">{s.title}</h2>
            <p className="mt-1 text-muted">{s.body}</p>
            {s.say && <p className="mt-3 rounded-lg bg-sky/15 p-3 text-sm"><span className="font-semibold">Say: </span>{s.say}</p>}
          </li>
        ))}
      </ol>
      <button className={`btn mt-8 ${done ? "btn-ghost" : "btn-primary"}`} onClick={() => toggleComplete(lesson.id)} aria-pressed={done}>
        {done ? "Completed. Tap to undo" : "Mark lesson as complete"}
      </button>
    </>
  );
}
