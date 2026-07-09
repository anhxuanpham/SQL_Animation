/**
 * Tiny localStorage-backed progress store shared across components via
 * useSyncExternalStore. Tracks lesson completion and which exercises are done.
 */

const STORAGE_KEY = "sql-visual-academy:progress:v1";

export interface LessonProgress {
  completed: boolean;
  exercises: string[];
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
}

const EMPTY: ProgressState = { lessons: {} };

let state: ProgressState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lessons: {} };
    const parsed = JSON.parse(raw) as ProgressState;
    if (!parsed || typeof parsed !== "object" || !parsed.lessons) {
      return { lessons: {} };
    }
    return parsed;
  } catch {
    return { lessons: {} };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — ignore */
  }
}

function emit() {
  for (const l of listeners) l();
}

/** Ensure we've read from localStorage (client only). Idempotent. */
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  state = load();
  hydrated = true;
}

export const progressStore = {
  subscribe(listener: () => void) {
    ensureHydrated();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ProgressState {
    ensureHydrated();
    return state;
  },
  getServerSnapshot(): ProgressState {
    return EMPTY;
  },
  getLesson(lessonId: string): LessonProgress {
    return state.lessons[lessonId] ?? { completed: false, exercises: [] };
  },
  markLessonComplete(lessonId: string, completed = true) {
    const prev = this.getLesson(lessonId);
    state = {
      lessons: {
        ...state.lessons,
        [lessonId]: { ...prev, completed },
      },
    };
    persist();
    emit();
  },
  markExerciseComplete(lessonId: string, exerciseId: string) {
    const prev = this.getLesson(lessonId);
    if (prev.exercises.includes(exerciseId)) return;
    state = {
      lessons: {
        ...state.lessons,
        [lessonId]: {
          ...prev,
          exercises: [...prev.exercises, exerciseId],
        },
      },
    };
    persist();
    emit();
  },
  reset() {
    state = { lessons: {} };
    persist();
    emit();
  },
};
