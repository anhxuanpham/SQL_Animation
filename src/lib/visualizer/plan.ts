/**
 * Turns a query + a live database into a "visualization plan": the real
 * intermediate data (which rows pass WHERE, group membership, join matches,
 * mutation diffs) plus an ordered list of narration frames.
 *
 * All intermediate data is derived by running real SQL (via SAVEPOINT for
 * mutations, so the practice database is never modified), which keeps the
 * animation faithful to how SQLite actually behaves.
 */

import type { SqlDatabase, SqlValue, QueryResult } from "@/lib/db/sql-engine";
import type { LessonStep, SqlClause } from "@/lib/lessons/types";
import {
  analyzeQuery,
  explainAnimationBlock,
  type AnimationBlockReason,
  type SelectAnalysis,
  type InsertAnalysis,
  type UpdateAnalysis,
  type DeleteAnalysis,
  type ColumnRef,
  type TableRef,
} from "./analyze";
import {
  buildCtePlan,
  buildSubqueryPlan,
  buildWindowPlan,
  type CteVizData,
  type SubqueryVizData,
  type WindowVizData,
} from "./plan-advanced";

export type { CteVizData, SubqueryVizData, WindowVizData };

export interface Frame {
  clause: SqlClause;
  title: string;
  description: string;
}

export interface VizRow {
  /** Stable animation key (row's id column when available, else row index). */
  id: number;
  cells: SqlValue[];
  pass: boolean;
}

export interface SelectVizData {
  kind: "select";
  table: string;
  columns: string[];
  rows: VizRow[];
  keptColumns: number[];
  orderedIds: number[];
  limit: number | null;
  hasWhere: boolean;
  hasOrder: boolean;
  isDistinct: boolean;
  /** Row ids that are duplicates under DISTINCT (dimmed after SELECT). */
  duplicateIds: number[];
  result: QueryResult;
  frames: Frame[];
}

export interface JoinStepData {
  joinKind: "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS";
  left: { table: string; columns: string[]; rows: SqlValue[][]; keyIndex: number };
  right: { table: string; columns: string[]; rows: SqlValue[][]; keyIndex: number };
  matches: { leftIndex: number; rightIndex: number }[];
}

export interface JoinVizData {
  kind: "join";
  joinKind: "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS";
  left: { table: string; columns: string[]; rows: SqlValue[][]; keyIndex: number };
  right: { table: string; columns: string[]; rows: SqlValue[][]; keyIndex: number };
  /** Pairs of matching row indexes (leftIndex, rightIndex). */
  matches: { leftIndex: number; rightIndex: number }[];
  /** Extra joins after the first (multi-join chain). */
  chain: JoinStepData[];
  result: QueryResult;
  frames: Frame[];
}

export interface GroupVizData {
  kind: "group";
  table: string;
  columns: string[];
  rows: { id: number; cells: SqlValue[]; groupKey: string }[];
  groups: {
    key: string;
    label: string;
    colorIndex: number;
    rowIds: number[];
    count: number;
    passesHaving: boolean;
  }[];
  groupColumnIndex: number;
  /** Indexes of all GROUP BY columns (multi-col support). */
  groupColumnIndexes: number[];
  hasHaving: boolean;
  result: QueryResult;
  frames: Frame[];
}

export interface MutationVizData {
  kind: "mutation";
  operation: "insert" | "update" | "delete";
  table: string;
  columns: string[];
  beforeRows: { id: number; cells: SqlValue[] }[];
  afterRows: { id: number; cells: SqlValue[] }[];
  addedIds: number[];
  deletedIds: number[];
  updatedIds: number[];
  /** id -> set of changed column indexes (for UPDATE). */
  changed: Record<number, number[]>;
  rowsModified: number;
  frames: Frame[];
}

export interface NoneVizData {
  kind: "none";
  reason?: AnimationBlockReason;
  message?: string;
}

export type VizPlan =
  | SelectVizData
  | JoinVizData
  | GroupVizData
  | MutationVizData
  | CteVizData
  | SubqueryVizData
  | WindowVizData
  | NoneVizData;

const CONCEPTUAL_MESSAGE =
  "Bài học mang tính khái niệm — animation chi tiết không bắt buộc. Bạn vẫn có thể chạy SQL tự do ở khu vực thực hành.";

function nonePlan(sql: string, forced?: AnimationBlockReason): NoneVizData {
  if (forced === "conceptual") {
    return { kind: "none", reason: "conceptual", message: CONCEPTUAL_MESSAGE };
  }
  if (forced) {
    const { message } = explainAnimationBlock(sql);
    return { kind: "none", reason: forced, message };
  }
  const { reason, message } = explainAnimationBlock(sql);
  return { kind: "none", reason, message };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function fromSql(t: TableRef): string {
  return t.alias ? `${t.table} ${t.alias}` : t.table;
}

function rowId(cells: SqlValue[], fallbackIndex: number): number {
  const first = cells[0];
  return typeof first === "number" ? first : fallbackIndex;
}

function compareValues(a: SqlValue, b: SqlValue): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // NULLs last
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function baseColumnName(expr: string): string {
  return expr
    .replace(/\s+as\s+\w+$/i, "")
    .trim()
    .split(".")
    .pop()!
    .replace(/["'`]/g, "")
    .trim();
}

function resolveColumnIndex(columns: string[], expr: string): number {
  const base = baseColumnName(expr).toLowerCase();
  return columns.findIndex((c) => c.toLowerCase() === base);
}

/** Pick narration for a clause, preferring authored lesson steps. */
function narrationPicker(authored?: LessonStep[]) {
  const used = new Set<number>();
  return (clause: SqlClause, fallback: { title: string; description: string }): Frame => {
    if (authored) {
      const idx = authored.findIndex(
        (s, i) => !used.has(i) && s.clause === clause,
      );
      if (idx >= 0) {
        used.add(idx);
        return {
          clause,
          title: authored[idx].title,
          description: authored[idx].description,
        };
      }
    }
    return { clause, ...fallback };
  };
}

// ---------------------------------------------------------------------------
// SELECT pipeline
// ---------------------------------------------------------------------------

function buildSelectPlan(
  db: SqlDatabase,
  a: SelectAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): SelectVizData | null {
  if (!a.from) return null;
  const from = fromSql(a.from);

  let columns: string[];
  let rows: VizRow[];

  try {
    if (a.where) {
      const r = db.exec(
        `SELECT *, CASE WHEN (${a.where}) THEN 1 ELSE 0 END AS __pass FROM ${from}`,
      );
      columns = r.columns.slice(0, -1);
      rows = r.rows.map((row, i) => ({
        id: rowId(row.slice(0, -1), i),
        cells: row.slice(0, -1),
        pass: Boolean(row[row.length - 1]),
      }));
    } else {
      const r = db.exec(`SELECT * FROM ${from}`);
      columns = r.columns;
      rows = r.rows.map((row, i) => ({
        id: rowId(row, i),
        cells: row,
        pass: true,
      }));
    }
  } catch {
    return null;
  }

  // Which columns survive SELECT projection.
  const keptColumns = a.isStar
    ? columns.map((_, i) => i)
    : (() => {
        const items = a.columnsRaw.split(",");
        const set = new Set<number>();
        for (const item of items) {
          const idx = resolveColumnIndex(columns, item);
          if (idx >= 0) set.add(idx);
        }
        return set.size > 0 ? [...set].sort((x, y) => x - y) : columns.map((_, i) => i);
      })();

  // ORDER BY among passing rows.
  const passing = rows.filter((r) => r.pass);
  if (a.orderBy.length > 0) {
    passing.sort((ra, rb) => {
      for (const term of a.orderBy) {
        const ci = resolveColumnIndex(columns, term.expr);
        if (ci < 0) continue;
        let c = compareValues(ra.cells[ci], rb.cells[ci]);
        if (term.dir === "DESC") c = -c;
        if (c !== 0) return c;
      }
      return 0;
    });
  }
  const orderedIds = passing.map((r) => r.id);

  let result: QueryResult;
  try {
    result = db.exec(rawQuery);
  } catch {
    result = { columns, rows: [], rowsModified: 0, elapsedMs: 0 };
  }

  // DISTINCT: mark duplicate projected keys among passing rows (keep first).
  const duplicateIds: number[] = [];
  if (a.isDistinct) {
    const seen = new Set<string>();
    for (const id of orderedIds) {
      const row = rows.find((r) => r.id === id);
      if (!row) continue;
      const key = keptColumns.map((ci) => String(row.cells[ci])).join("\u0001");
      if (seen.has(key)) duplicateIds.push(id);
      else seen.add(key);
    }
  }

  const pick = narrationPicker(authored);
  const frames: Frame[] = [];
  frames.push(
    pick("FROM", {
      title: `Nạp bảng ${a.from.table}`,
      description: `DBMS đọc toàn bộ ${rows.length} dòng của bảng ${a.from.table} vào vùng xử lý.`,
    }),
  );
  if (a.where) {
    const kept = rows.filter((r) => r.pass).length;
    frames.push(
      pick("WHERE", {
        title: "Lọc theo điều kiện WHERE",
        description: `Duyệt từng dòng: ${kept}/${rows.length} dòng thỏa điều kiện được giữ lại, phần còn lại bị loại.`,
      }),
    );
  }
  frames.push(
    pick("SELECT", {
      title: a.isStar ? "Chọn tất cả cột" : "Chọn các cột yêu cầu",
      description: a.isStar
        ? "Dấu * giữ lại toàn bộ cột cho kết quả."
        : `Chỉ giữ lại ${keptColumns.length} cột, các cột khác mờ đi.`,
    }),
  );
  if (a.isDistinct) {
    frames.push(
      pick("SELECT", {
        title: "DISTINCT — loại trùng",
        description: `${duplicateIds.length} dòng trùng bị loại; chỉ giữ bản ghi đầu tiên của mỗi giá trị.`,
      }),
    );
  }
  if (a.orderBy.length > 0) {
    frames.push(
      pick("ORDER BY", {
        title: "Sắp xếp kết quả",
        description: `Các dòng di chuyển vị trí theo ${a.orderBy
          .map((o) => `${o.expr} ${o.dir}`)
          .join(", ")}.`,
      }),
    );
  }
  if (a.limit != null) {
    frames.push(
      pick("LIMIT", {
        title: `Giới hạn ${a.limit} dòng`,
        description: `Chỉ giữ lại ${a.limit} dòng đầu tiên, phần còn lại bị cắt bỏ.`,
      }),
    );
  }

  return {
    kind: "select",
    table: a.from.table,
    columns,
    rows,
    keptColumns,
    orderedIds,
    limit: a.limit ?? null,
    hasWhere: Boolean(a.where),
    hasOrder: a.orderBy.length > 0,
    isDistinct: a.isDistinct,
    duplicateIds,
    result,
    frames,
  };
}

// ---------------------------------------------------------------------------
// JOIN
// ---------------------------------------------------------------------------

function buildJoinPlan(
  db: SqlDatabase,
  a: SelectAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): JoinVizData | null {
  if (!a.from || a.joins.length === 0) return null;
  const join = a.joins[0];
  const leftRef = a.from;
  const rightRef = join.right;

  let leftData: QueryResult;
  let rightData: QueryResult;
  try {
    leftData = db.exec(`SELECT * FROM ${leftRef.table}`);
    rightData = db.exec(`SELECT * FROM ${rightRef.table}`);
  } catch {
    return null;
  }

  // Resolve which ON side belongs to which table.
  const matchesRef = (ref: ColumnRef, ref2: TableRef) =>
    ref.qualifier?.toLowerCase() === ref2.table.toLowerCase() ||
    ref.qualifier?.toLowerCase() === ref2.alias?.toLowerCase();

  const resolveSide = (ref: ColumnRef) => {
    if (matchesRef(ref, leftRef)) {
      return { side: "left" as const, idx: resolveColumnIndex(leftData.columns, ref.column) };
    }
    if (matchesRef(ref, rightRef)) {
      return { side: "right" as const, idx: resolveColumnIndex(rightData.columns, ref.column) };
    }
    // Unqualified: try left then right.
    const li = resolveColumnIndex(leftData.columns, ref.column);
    if (li >= 0) return { side: "left" as const, idx: li };
    return { side: "right" as const, idx: resolveColumnIndex(rightData.columns, ref.column) };
  };

  const sideA = resolveSide(join.onLeft);
  const sideB = resolveSide(join.onRight);
  const leftKeyIndex = sideA.side === "left" ? sideA.idx : sideB.idx;
  const rightKeyIndex = sideA.side === "right" ? sideA.idx : sideB.idx;

  if (leftKeyIndex < 0 || rightKeyIndex < 0) return null;

  const matches: { leftIndex: number; rightIndex: number }[] = [];
  leftData.rows.forEach((lrow, li) => {
    rightData.rows.forEach((rrow, ri) => {
      if (
        lrow[leftKeyIndex] !== null &&
        lrow[leftKeyIndex] === rrow[rightKeyIndex]
      ) {
        matches.push({ leftIndex: li, rightIndex: ri });
      }
    });
  });

  // Additional joins (2nd, 3rd, …) as chain steps for multi-join narration.
  const chain: JoinVizData["chain"] = [];
  for (let ji = 1; ji < a.joins.length; ji++) {
    const j = a.joins[ji];
    try {
      const rData = db.exec(`SELECT * FROM ${j.right.table}`);
      const rk = resolveColumnIndex(rData.columns, j.onRight.column);
      const lk = resolveColumnIndex(leftData.columns, j.onLeft.column);
      // Prefer matching against previous right table if qualifier matches
      const prevRight = chain.length
        ? chain[chain.length - 1].right
        : {
            table: rightRef.table,
            columns: rightData.columns,
            rows: rightData.rows,
            keyIndex: rightKeyIndex,
          };
      const leftSide =
        resolveColumnIndex(prevRight.columns, j.onLeft.column) >= 0
          ? prevRight
          : {
              table: leftRef.table,
              columns: leftData.columns,
              rows: leftData.rows,
              keyIndex: lk >= 0 ? lk : 0,
            };
      const leftKey =
        resolveColumnIndex(leftSide.columns, j.onLeft.column) >= 0
          ? resolveColumnIndex(leftSide.columns, j.onLeft.column)
          : resolveColumnIndex(leftSide.columns, j.onRight.column);
      const rightKey = rk >= 0 ? rk : 0;
      const m: { leftIndex: number; rightIndex: number }[] = [];
      leftSide.rows.forEach((lrow, li) => {
        rData.rows.forEach((rrow, ri) => {
          if (
            lrow[leftKey] !== null &&
            lrow[leftKey] === rrow[rightKey]
          ) {
            m.push({ leftIndex: li, rightIndex: ri });
          }
        });
      });
      chain.push({
        joinKind: j.kind,
        left: { ...leftSide, keyIndex: leftKey },
        right: {
          table: j.right.table,
          columns: rData.columns,
          rows: rData.rows,
          keyIndex: rightKey,
        },
        matches: m,
      });
    } catch {
      /* skip broken chain step */
    }
  }

  let result: QueryResult;
  try {
    result = db.exec(rawQuery);
  } catch {
    result = { columns: [], rows: [], rowsModified: 0, elapsedMs: 0 };
  }

  const pick = narrationPicker(authored);
  const frames: Frame[] = [
    pick("FROM", {
      title: "Hai bảng cạnh nhau",
      description: `Hiển thị ${leftRef.table} (trái) và ${rightRef.table} (phải).`,
    }),
    pick("ON", {
      title: "Khóa liên kết",
      description: `Làm nổi bật cột khóa ${leftRef.table}.${leftData.columns[leftKeyIndex]} và ${rightRef.table}.${rightData.columns[rightKeyIndex]}.`,
    }),
    pick("JOIN", {
      title: join.kind === "LEFT" ? "Nối và giữ bảng trái" : "Nối các dòng khớp",
      description:
        join.kind === "LEFT"
          ? "Mọi dòng bảng trái được giữ; dòng không khớp nhận NULL bên phải."
          : "Vẽ đường nối các cặp khớp; dòng không khớp mờ đi.",
    }),
  ];
  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    frames.push(
      pick("JOIN", {
        title: `JOIN tiếp theo: ${step.right.table}`,
        description: `${step.joinKind} JOIN với ${step.right.table} (${step.matches.length} cặp khớp).`,
      }),
    );
  }
  frames.push(
    pick("SELECT", {
      title: "Ghép thành kết quả",
      description: `Các cặp khớp được gộp thành bảng kết quả (${result.rows.length} dòng).`,
    }),
  );

  return {
    kind: "join",
    joinKind: join.kind,
    left: {
      table: leftRef.table,
      columns: leftData.columns,
      rows: leftData.rows,
      keyIndex: leftKeyIndex,
    },
    right: {
      table: rightRef.table,
      columns: rightData.columns,
      rows: rightData.rows,
      keyIndex: rightKeyIndex,
    },
    matches,
    chain,
    result,
    frames,
  };
}

// ---------------------------------------------------------------------------
// GROUP BY / aggregate
// ---------------------------------------------------------------------------

function buildGroupPlan(
  db: SqlDatabase,
  a: SelectAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): GroupVizData | null {
  if (!a.from) return null;
  const from = fromSql(a.from);

  let base: QueryResult;
  try {
    base = a.where
      ? db.exec(`SELECT * FROM ${from} WHERE ${a.where}`)
      : db.exec(`SELECT * FROM ${from}`);
  } catch {
    return null;
  }

  const groupColumnIndexes =
    a.groupBy.length > 0
      ? a.groupBy
          .map((g) => resolveColumnIndex(base.columns, g))
          .filter((i) => i >= 0)
      : [];
  const groupColumnIndex =
    groupColumnIndexes.length > 0 ? groupColumnIndexes[0] : -1;

  const rows = base.rows.map((cells, i) => ({
    id: rowId(cells, i),
    cells,
    groupKey:
      groupColumnIndexes.length > 0
        ? groupColumnIndexes.map((gi) => String(cells[gi])).join(" | ")
        : "__ALL__",
  }));

  let result: QueryResult;
  try {
    result = db.exec(rawQuery);
  } catch {
    return null;
  }

  // Surviving group keys from result: first N group columns when multi-col.
  const survivingKeys = new Set<string>();
  if (groupColumnIndexes.length > 0 && result.columns.length > 0) {
    const n = Math.min(groupColumnIndexes.length, result.columns.length);
    for (const r of result.rows) {
      survivingKeys.add(
        Array.from({ length: n }, (_, i) => String(r[i])).join(" | "),
      );
    }
  }

  const groupOrder: string[] = [];
  const groupMap = new Map<string, number[]>();
  for (const r of rows) {
    if (!groupMap.has(r.groupKey)) {
      groupMap.set(r.groupKey, []);
      groupOrder.push(r.groupKey);
    }
    groupMap.get(r.groupKey)!.push(r.id);
  }

  const groups = groupOrder.map((key, i) => ({
    key,
    label: key === "__ALL__" ? "Tất cả" : key,
    colorIndex: i % 6,
    rowIds: groupMap.get(key)!,
    count: groupMap.get(key)!.length,
    passesHaving:
      groupColumnIndexes.length === 0 || survivingKeys.size === 0
        ? true
        : survivingKeys.has(key),
  }));

  const pick = narrationPicker(authored);
  const frames: Frame[] = [
    pick("FROM", {
      title: `Nạp bảng ${a.from.table}`,
      description: `Đưa ${rows.length} dòng vào vùng xử lý.`,
    }),
  ];
  if (groupColumnIndexes.length > 0) {
    frames.push(
      pick("GROUP BY", {
        title: `Gom nhóm theo ${a.groupBy.join(", ")}`,
        description: `Các dòng cùng giá trị được gom thành ${groups.length} nhóm, mỗi nhóm một khung màu.`,
      }),
    );
  }
  frames.push(
    pick("SELECT", {
      title: groupColumnIndexes.length > 0 ? "Tính tổng hợp mỗi nhóm" : "Tính tổng hợp",
      description:
        groupColumnIndexes.length > 0
          ? "Bộ đếm chạy để tính hàm tổng hợp cho từng nhóm."
          : "Toàn bộ bảng là một nhóm; hàm tổng hợp cho ra một dòng kết quả.",
    }),
  );
  if (a.having) {
    frames.push(
      pick("HAVING", {
        title: "Lọc nhóm với HAVING",
        description: "Các nhóm không đạt điều kiện HAVING sẽ mờ đi và bị loại.",
      }),
    );
  }

  return {
    kind: "group",
    table: a.from.table,
    columns: base.columns,
    rows,
    groups,
    groupColumnIndex,
    groupColumnIndexes,
    hasHaving: Boolean(a.having),
    result,
    frames,
  };
}

// ---------------------------------------------------------------------------
// Mutations (INSERT / UPDATE / DELETE) — computed via SAVEPOINT (no persist)
// ---------------------------------------------------------------------------

function buildMutationPlan(
  db: SqlDatabase,
  analysis: InsertAnalysis | UpdateAnalysis | DeleteAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): MutationVizData | null {
  const table = analysis.table;
  let columns: string[] = [];
  let beforeRows: { id: number; cells: SqlValue[] }[] = [];
  let afterRows: { id: number; cells: SqlValue[] }[] = [];
  let rowsModified = 0;

  try {
    const before = db.exec(`SELECT * FROM ${table}`);
    columns = before.columns;
    beforeRows = before.rows.map((cells, i) => ({ id: rowId(cells, i), cells }));

    // Apply the mutation inside a savepoint so the practice DB is untouched.
    db.exec("SAVEPOINT __viz");
    let modified = 0;
    try {
      const res = db.exec(rawQuery);
      modified = res.rowsModified;
      const after = db.exec(`SELECT * FROM ${table}`);
      afterRows = after.rows.map((cells, i) => ({ id: rowId(cells, i), cells }));
    } finally {
      db.exec("ROLLBACK TO __viz");
      db.exec("RELEASE __viz");
    }
    rowsModified = modified;
  } catch {
    return null;
  }

  const beforeById = new Map(beforeRows.map((r) => [r.id, r]));
  const afterById = new Map(afterRows.map((r) => [r.id, r]));

  const addedIds: number[] = [];
  const deletedIds: number[] = [];
  const updatedIds: number[] = [];
  const changed: Record<number, number[]> = {};

  for (const r of afterRows) {
    if (!beforeById.has(r.id)) addedIds.push(r.id);
  }
  for (const r of beforeRows) {
    if (!afterById.has(r.id)) deletedIds.push(r.id);
  }
  for (const r of afterRows) {
    const prev = beforeById.get(r.id);
    if (!prev) continue;
    const diffs: number[] = [];
    r.cells.forEach((c, i) => {
      if (String(c) !== String(prev.cells[i])) diffs.push(i);
    });
    if (diffs.length > 0) {
      updatedIds.push(r.id);
      changed[r.id] = diffs;
    }
  }

  const pick = narrationPicker(authored);
  const frames: Frame[] = [];
  if (analysis.kind === "insert") {
    frames.push(
      pick("INSERT", {
        title: `Thêm vào bảng ${table}`,
        description: "DBMS chuẩn bị thêm dòng mới vào bảng.",
      }),
      pick("VALUES", {
        title: "Tạo dòng mới",
        description: "Bộ giá trị được đóng gói thành một dòng dữ liệu.",
      }),
      pick("INSERT", {
        title: "Ghi vào bảng",
        description: `${addedIds.length} dòng mới trượt vào cuối bảng.`,
      }),
    );
  } else if (analysis.kind === "update") {
    frames.push(
      pick("WHERE", {
        title: "Tìm dòng cần cập nhật",
        description: `${updatedIds.length} dòng khớp điều kiện WHERE.`,
      }),
      pick("UPDATE", {
        title: "Dòng khớp sáng lên",
        description: "Các dòng sẽ được cập nhật được làm nổi bật.",
      }),
      pick("SET", {
        title: "Đổi giá trị",
        description: "Các ô được cập nhật đổi từ giá trị cũ sang giá trị mới.",
      }),
    );
  } else {
    frames.push(
      pick("WHERE", {
        title: "Tìm dòng cần xóa",
        description: `${deletedIds.length} dòng khớp điều kiện WHERE.`,
      }),
      pick("DELETE", {
        title: "Đánh dấu cảnh báo",
        description: "Các dòng sẽ bị xóa chuyển sang màu đỏ.",
      }),
      pick("DELETE", {
        title: "Xóa dòng",
        description: "Các dòng thu gọn và biến mất khỏi bảng.",
      }),
    );
  }

  return {
    kind: "mutation",
    operation: analysis.kind,
    table,
    columns,
    beforeRows,
    afterRows,
    addedIds,
    deletedIds,
    updatedIds,
    changed,
    rowsModified,
    frames,
  };
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

export type PreferredType =
  | "select"
  | "join"
  | "group"
  | "mutation"
  | "index"
  | "transaction"
  | "cte"
  | "subquery"
  | "window"
  | "none";

/**
 * Build a visualization plan for a query.
 *
 * Always prefers the **structure of the SQL** so free-form Run stays animated.
 * `preferred` only forces static for conceptual lessons on the canonical query,
 * or defers to dedicated index/transaction visualizers outside this function.
 */
export function buildVizPlan(
  db: SqlDatabase,
  rawQuery: string,
  preferred: PreferredType,
  authored?: LessonStep[],
  options?: { canonical?: boolean },
): VizPlan {
  const trimmed = rawQuery.trim();
  if (!trimmed) return nonePlan(rawQuery);

  // Conceptual lessons: only force static when still on the authored demo query.
  if (preferred === "none" && options?.canonical) {
    return nonePlan(rawQuery, "conceptual");
  }

  if (
    (preferred === "index" || preferred === "transaction") &&
    options?.canonical
  ) {
    return nonePlan(rawQuery, "conceptual");
  }

  const analysis = analyzeQuery(rawQuery);

  if (analysis.kind === "cte") {
    return (
      buildCtePlan(db, analysis, rawQuery, authored) ?? nonePlan(rawQuery)
    );
  }

  if (analysis.kind === "select") {
    if (analysis.hasWindow) {
      return (
        buildWindowPlan(db, analysis, rawQuery, authored) ?? nonePlan(rawQuery)
      );
    }
    if (analysis.scalarSubquery) {
      return (
        buildSubqueryPlan(db, analysis, rawQuery, authored) ??
        nonePlan(rawQuery)
      );
    }
    if (analysis.joins.length > 0) {
      return (
        buildJoinPlan(db, analysis, rawQuery, authored) ?? nonePlan(rawQuery)
      );
    }
    if (analysis.groupBy.length > 0 || analysis.hasAggregate) {
      return (
        buildGroupPlan(db, analysis, rawQuery, authored) ?? nonePlan(rawQuery)
      );
    }
    return (
      buildSelectPlan(db, analysis, rawQuery, authored) ?? nonePlan(rawQuery)
    );
  }

  if (
    analysis.kind === "insert" ||
    analysis.kind === "update" ||
    analysis.kind === "delete"
  ) {
    return (
      buildMutationPlan(db, analysis, rawQuery, authored) ?? nonePlan(rawQuery)
    );
  }

  return nonePlan(rawQuery);
}
