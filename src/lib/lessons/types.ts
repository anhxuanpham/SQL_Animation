/**
 * Lesson content model.
 *
 * Lessons are pure data (no JSX) so content lives entirely in config files and
 * the UI stays generic. The QueryVisualizer computes animation frames live from
 * the query + real database, while `steps` provides authored narration.
 */

export type LessonLevel = "beginner" | "intermediate" | "advanced";

/** SQL clauses we can highlight in the editor + narration. */
export type SqlClause =
  | "WITH"
  | "SELECT"
  | "FROM"
  | "JOIN"
  | "ON"
  | "WHERE"
  | "GROUP BY"
  | "HAVING"
  | "ORDER BY"
  | "LIMIT"
  | "INSERT"
  | "VALUES"
  | "UPDATE"
  | "SET"
  | "DELETE"
  | "OVER"
  | "BEGIN"
  | "COMMIT"
  | "ROLLBACK"
  | "CREATE";

/** Which animated visualizer a lesson uses. */
export type VisualizationType =
  | "select" // FROM -> WHERE -> SELECT -> ORDER BY -> LIMIT pipeline
  | "join" // two-table join with connection lines
  | "group" // GROUP BY + aggregate counter
  | "mutation" // INSERT / UPDATE / DELETE
  | "index" // full scan vs index lookup
  | "transaction" // BEGIN / COMMIT / ROLLBACK
  | "cte" // WITH … AS materialize then outer query
  | "subquery" // scalar subquery bubble then outer filter
  | "window" // PARTITION + ROW_NUMBER
  | "none"; // theory only (no dedicated animation)

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface LessonStep {
  /** Clause highlighted while this step is on screen. */
  clause?: SqlClause;
  title: string;
  description: string;
}

export interface ExerciseSpec {
  id: string;
  prompt: string;
  /** Pre-filled editor content for the exercise (optional). */
  starterQuery?: string;
  /** Reference solution — executed live to derive the expected result. */
  solutionQuery: string;
  hint: string;
  /** Compare results ignoring row ordering (use when no ORDER BY is required). */
  orderInsensitive?: boolean;
  /**
   * For mutation exercises: after running the learner's and the solution's
   * statements on separate fresh databases, this SELECT is run on each to
   * compare the resulting table state instead of the (empty) mutation result.
   */
  verifyQuery?: string;
  successMessage?: string;
}

export interface LessonVisualization {
  type: VisualizationType;
  /** Query the animation is built from (defaults to the lesson's initialQuery). */
  query?: string;
}

export interface Lesson {
  /** URL slug + stable id. */
  id: string;
  title: string;
  level: LessonLevel;
  /** Section label used to group lessons in the sidebar. */
  category: string;
  /** One-line summary for cards + sidebar. */
  summary: string;
  /** Intro paragraph shown at the top of the theory panel. */
  description: string;
  /** Theory body: array of markdown-ish paragraphs / bullet lines. */
  theory: string[];
  keyTerms?: KeyTerm[];
  /** Sample tables relevant to this lesson (keys of TABLE_SCHEMAS). */
  tables: string[];
  initialQuery: string;
  visualization: LessonVisualization;
  steps?: LessonStep[];
  exercises: ExerciseSpec[];
  /** Estimated minutes to complete. */
  estimatedMinutes?: number;
}

export const LEVEL_LABELS: Record<LessonLevel, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export const LEVEL_BADGE_VARIANT: Record<
  LessonLevel,
  "beginner" | "intermediate" | "advanced"
> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

/**
 * Visual metadata per clause. `token` maps to the Tailwind color tokens defined
 * in globals.css (e.g. text-clause-select). Keep names in sync with that file.
 */
export const CLAUSE_META: Record<
  SqlClause,
  { token: string; label: string }
> = {
  WITH: { token: "clause-limit", label: "CTE tạm thời" },
  SELECT: { token: "clause-select", label: "Chọn cột kết quả" },
  FROM: { token: "clause-from", label: "Nguồn dữ liệu" },
  JOIN: { token: "clause-join", label: "Ghép bảng" },
  ON: { token: "clause-join", label: "Điều kiện ghép" },
  WHERE: { token: "clause-where", label: "Lọc dòng" },
  "GROUP BY": { token: "clause-groupby", label: "Gom nhóm" },
  HAVING: { token: "clause-having", label: "Lọc nhóm" },
  "ORDER BY": { token: "clause-orderby", label: "Sắp xếp" },
  LIMIT: { token: "clause-limit", label: "Giới hạn số dòng" },
  INSERT: { token: "clause-from", label: "Thêm dữ liệu" },
  VALUES: { token: "clause-select", label: "Giá trị thêm vào" },
  UPDATE: { token: "clause-where", label: "Cập nhật dữ liệu" },
  SET: { token: "clause-select", label: "Gán giá trị mới" },
  DELETE: { token: "clause-orderby", label: "Xóa dữ liệu" },
  OVER: { token: "clause-groupby", label: "Cửa sổ (window)" },
  BEGIN: { token: "clause-join", label: "Bắt đầu transaction" },
  COMMIT: { token: "clause-from", label: "Lưu thay đổi" },
  ROLLBACK: { token: "clause-orderby", label: "Hủy thay đổi" },
  CREATE: { token: "clause-limit", label: "Tạo đối tượng" },
};
