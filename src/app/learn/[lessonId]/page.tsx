import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAdjacentLessons,
  getAllLessonIds,
  getLesson,
} from "@/lib/lessons";
import { LessonWorkspace } from "@/components/lesson/lesson-workspace";

export function generateStaticParams() {
  return getAllLessonIds().map((lessonId) => ({ lessonId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) return { title: "Không tìm thấy bài học" };
  return {
    title: lesson.title,
    description: lesson.summary,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  const adjacent = getAdjacentLessons(lessonId);
  // key forces a full remount so editor/run state never leaks across lessons
  return (
    <LessonWorkspace key={lesson.id} lesson={lesson} adjacent={adjacent} />
  );
}
