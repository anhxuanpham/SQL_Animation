import { BASIC_LESSONS } from "./basic";
import { INTERMEDIATE_LESSONS } from "./intermediate";
import { ADVANCED_LESSONS } from "./advanced";
import { LEVEL_LABELS, type Lesson, type LessonLevel } from "./types";

export * from "./types";

/** Full ordered curriculum — order here defines prev/next navigation. */
export const ALL_LESSONS: Lesson[] = [
  ...BASIC_LESSONS,
  ...INTERMEDIATE_LESSONS,
  ...ADVANCED_LESSONS,
];

export interface PathSection {
  level: LessonLevel;
  label: string;
  lessons: Lesson[];
}

/** Sidebar structure grouped by level. */
export const LEARNING_PATH: PathSection[] = [
  { level: "beginner", label: LEVEL_LABELS.beginner, lessons: BASIC_LESSONS },
  {
    level: "intermediate",
    label: LEVEL_LABELS.intermediate,
    lessons: INTERMEDIATE_LESSONS,
  },
  { level: "advanced", label: LEVEL_LABELS.advanced, lessons: ADVANCED_LESSONS },
];

const LESSON_BY_ID = new Map(ALL_LESSONS.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson | undefined {
  return LESSON_BY_ID.get(id);
}

export function getAllLessonIds(): string[] {
  return ALL_LESSONS.map((l) => l.id);
}

export interface AdjacentLessons {
  prev: Lesson | null;
  next: Lesson | null;
  index: number;
  total: number;
}

export function getAdjacentLessons(id: string): AdjacentLessons {
  const index = ALL_LESSONS.findIndex((l) => l.id === id);
  return {
    prev: index > 0 ? ALL_LESSONS[index - 1] : null,
    next:
      index >= 0 && index < ALL_LESSONS.length - 1
        ? ALL_LESSONS[index + 1]
        : null,
    index,
    total: ALL_LESSONS.length,
  };
}

/** The first lesson — used by the "Start learning" CTA. */
export const FIRST_LESSON_ID = ALL_LESSONS[0]?.id ?? "what-is-database";
