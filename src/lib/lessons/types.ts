/**
 * Lesson content model.
 *
 * Lessons are pure data (no JSX) so content lives entirely in config files and
 * the UI stays generic. The QueryVisualizer computes animation frames live from
 * the query + real database, while `steps` provides authored narration.
 */

export type LessonLevel = "beginner" | "intermediate" | "advanced";
export type SqlDialect = "sqlite" | "oracle";
export type OracleProcedureVariant =
  | "lifecycle"
  | "parameters"
  | "select-into"
  | "exception"
  | "transaction"
  | "package";
export type OracleCursorVariant =
  | "implicit"
  | "explicit"
  | "for-loop"
  | "for-update"
  | "ref-cursor";

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
  | "CREATE"
  | "PROCEDURE"
  | "IF"
  | "OUT"
  | "EXCEPTION"
  | "CURSOR"
  | "OPEN"
  | "FETCH"
  | "LOOP"
  | "CLOSE"
  | "FOR UPDATE"
  | "CURRENT OF";

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
  | "procedure" // Oracle PL/SQL stored procedure lifecycle
  | "cursor" // Oracle implicit/explicit/ref cursor lifecycle
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
  /**
   * Structural validation for dialects that cannot execute in the in-browser
   * SQLite engine (currently Oracle PL/SQL).
   */
  validation?: {
    mode: "structure";
    requirements: {
      label: string;
      pattern: string;
      flags?: string;
    }[];
    forbidden?: {
      label: string;
      pattern: string;
      flags?: string;
    }[];
  };
  successMessage?: string;
}

export interface LessonVisualization {
  type: VisualizationType;
  /** Query the animation is built from (defaults to the lesson's initialQuery). */
  query?: string;
  /** Selects the teaching model used by the Oracle procedure visualizer. */
  oracleVariant?: OracleProcedureVariant;
  /** Selects the teaching model used by the Oracle cursor visualizer. */
  oracleCursorVariant?: OracleCursorVariant;
}

export interface Lesson {
  /** URL slug + stable id. */
  id: string;
  title: string;
  level: LessonLevel;
  /** Defaults to SQLite; Oracle lessons use a PL/SQL-aware editor + simulator. */
  dialect?: SqlDialect;
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
  PROCEDURE: { token: "clause-limit", label: "Biên dịch và lưu procedure" },
  IF: { token: "clause-where", label: "Kiểm tra điều kiện" },
  OUT: { token: "clause-groupby", label: "Trả giá trị qua tham số OUT" },
  EXCEPTION: { token: "clause-orderby", label: "Chặn và báo lỗi nghiệp vụ" },
  CURSOR: { token: "clause-limit", label: "Khai báo result-set cursor" },
  OPEN: { token: "clause-from", label: "Mở cursor và chạy query" },
  FETCH: { token: "clause-select", label: "Đọc dòng hiện tại" },
  LOOP: { token: "clause-groupby", label: "Lặp qua các dòng" },
  CLOSE: { token: "clause-orderby", label: "Đóng và giải phóng cursor" },
  "FOR UPDATE": { token: "clause-where", label: "Khóa các dòng sẽ cập nhật" },
  "CURRENT OF": { token: "clause-join", label: "Cập nhật dòng cursor hiện tại" },
};
