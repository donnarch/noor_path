import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, lessons } from "@/content/lessons";
import { LessonView } from "@/components/learning/LessonView";

export const dynamicParams = false;
export const generateStaticParams = () => lessons.map((l) => ({ id: l.id }));
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const l = getLesson(params.id);
  return { title: l?.title ?? "Lesson", description: l?.summary };
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const lesson = getLesson(params.id);
  if (!lesson) notFound();
  return (
    <div className="container-page max-w-3xl py-12">
      <Link href="/learn" className="text-sm text-muted underline">All lessons</Link>
      <h1 className="h-display mt-3">{lesson.title}</h1>
      <p className="mt-3 text-lg text-muted">{lesson.summary}</p>
      <LessonView lesson={lesson} />
    </div>
  );
}
