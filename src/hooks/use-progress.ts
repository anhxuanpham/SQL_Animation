"use client";

import * as React from "react";

import { progressStore, type ProgressState } from "@/lib/progress/progress-store";
import { ALL_LESSONS } from "@/lib/lessons";

export function useProgress() {
  const state: ProgressState = React.useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );

  const isLessonComplete = React.useCallback(
    (lessonId: string) => state.lessons[lessonId]?.completed ?? false,
    [state],
  );

  const completedExercises = React.useCallback(
    (lessonId: string) => new Set(state.lessons[lessonId]?.exercises ?? []),
    [state],
  );

  const completedLessonCount = React.useMemo(
    () => Object.values(state.lessons).filter((l) => l.completed).length,
    [state],
  );

  return {
    state,
    isLessonComplete,
    completedExercises,
    completedLessonCount,
    totalLessons: ALL_LESSONS.length,
    markLessonComplete: progressStore.markLessonComplete.bind(progressStore),
    markExerciseComplete: progressStore.markExerciseComplete.bind(progressStore),
    reset: progressStore.reset.bind(progressStore),
  };
}
