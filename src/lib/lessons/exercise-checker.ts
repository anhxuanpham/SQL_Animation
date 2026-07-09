import {
  createDatabase,
  SqlExecutionError,
  type QueryResult,
  type SqlValue,
} from "@/lib/db/sql-engine";
import type { ExerciseSpec } from "./types";

export interface CheckResult {
  status: "pass" | "fail" | "error";
  message: string;
  /** The learner's produced result, for display. */
  learnerResult: QueryResult | null;
  /** Expected result from the solution (populated on fail for diff UI). */
  expectedResult?: QueryResult | null;
  /** Populated when status === "error". */
  errorDetail?: string;
  /** Human summary of mismatch (column count, row count, sample rows). */
  diffSummary?: string;
}

function cellKey(v: SqlValue): string {
  if (v === null) return "\u0000NULL";
  if (typeof v === "number") return `n:${v}`;
  if (v instanceof Uint8Array) return `b:${v.length}`;
  return `s:${v}`;
}

function rowsKey(rows: SqlValue[][], orderInsensitive: boolean): string {
  const encoded = rows.map((r) => r.map(cellKey).join("\u0001"));
  if (orderInsensitive) encoded.sort();
  return encoded.join("\u0002");
}

/**
 * Compare two results for exercise checking. We compare column *count* and the
 * row values (optionally order-insensitive). Column names are intentionally not
 * compared so that alias differences don't cause false negatives.
 */
function resultsMatch(
  a: QueryResult,
  b: QueryResult,
  orderInsensitive: boolean,
): boolean {
  if (a.columns.length !== b.columns.length) return false;
  if (a.rows.length !== b.rows.length) return false;
  return rowsKey(a.rows, orderInsensitive) === rowsKey(b.rows, orderInsensitive);
}

function buildDiffSummary(learner: QueryResult, expected: QueryResult): string {
  const parts: string[] = [];
  if (learner.columns.length !== expected.columns.length) {
    parts.push(
      `Số cột: bạn có ${learner.columns.length}, đáp án có ${expected.columns.length}.`,
    );
  }
  if (learner.rows.length !== expected.rows.length) {
    parts.push(
      `Số dòng: bạn có ${learner.rows.length}, đáp án có ${expected.rows.length}.`,
    );
  }
  if (parts.length === 0) {
    parts.push(
      "Số cột và số dòng khớp nhưng giá trị (hoặc thứ tự) khác đáp án.",
    );
  }
  return parts.join(" ");
}

/**
 * Run the learner's query and the reference solution on two fresh, isolated
 * databases and compare. For mutation exercises (`verifyQuery` set), the
 * comparison is done on the resulting table state.
 */
export async function checkExercise(
  exercise: ExerciseSpec,
  learnerQuery: string,
): Promise<CheckResult> {
  const trimmed = learnerQuery.trim();
  if (!trimmed) {
    return {
      status: "error",
      message: "Hãy nhập câu lệnh trước khi kiểm tra.",
      learnerResult: null,
    };
  }

  const learnerDb = await createDatabase();
  const solutionDb = await createDatabase();

  try {
    let learnerResult: QueryResult;
    try {
      learnerResult = learnerDb.exec(learnerQuery);
      if (exercise.verifyQuery) {
        learnerResult = learnerDb.exec(exercise.verifyQuery);
      }
    } catch (err) {
      const detail =
        err instanceof SqlExecutionError ? err.original : String(err);
      const friendly =
        err instanceof SqlExecutionError
          ? err.message + (err.hint ? ` (${err.hint})` : "")
          : "Câu lệnh gặp lỗi khi chạy.";
      return {
        status: "error",
        message: friendly,
        learnerResult: null,
        errorDetail: detail,
      };
    }

    let solutionResult = solutionDb.exec(exercise.solutionQuery);
    if (exercise.verifyQuery) {
      solutionResult = solutionDb.exec(exercise.verifyQuery);
    }

    const orderInsensitive = exercise.orderInsensitive ?? false;
    const passed = resultsMatch(learnerResult, solutionResult, orderInsensitive);

    if (passed) {
      return {
        status: "pass",
        message: exercise.successMessage ?? "Chính xác! Kết quả khớp với đáp án.",
        learnerResult: exercise.verifyQuery ? null : learnerResult,
      };
    }
    return {
      status: "fail",
      message:
        "Kết quả chưa khớp với đáp án. So sánh bảng của bạn và đáp án bên dưới.",
      learnerResult,
      expectedResult: solutionResult,
      diffSummary: buildDiffSummary(learnerResult, solutionResult),
    };
  } finally {
    learnerDb.close();
    solutionDb.close();
  }
}
