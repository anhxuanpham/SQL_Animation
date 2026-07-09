/**
 * Advanced visualization plans: CTE, scalar subquery, window functions.
 */

import type { SqlDatabase, SqlValue, QueryResult } from "@/lib/db/sql-engine";
import type { LessonStep, SqlClause } from "@/lib/lessons/types";
import type {
  CteAnalysis,
  SelectAnalysis,
  WindowInfo,
} from "./analyze";
import type { Frame } from "./plan";

export interface CteVizData {
  kind: "cte";
  cteName: string;
  innerColumns: string[];
  innerRows: SqlValue[][];
  outerResult: QueryResult;
  frames: Frame[];
}

export interface SubqueryVizData {
  kind: "subquery";
  table: string;
  columns: string[];
  rows: { id: number; cells: SqlValue[]; pass: boolean }[];
  scalarValue: SqlValue;
  subquerySql: string;
  result: QueryResult;
  frames: Frame[];
}

export interface WindowVizData {
  kind: "window";
  table: string;
  columns: string[];
  /** Base rows before numbering. */
  rows: { id: number; cells: SqlValue[]; partitionKey: string; rn: number }[];
  partitions: { key: string; label: string; colorIndex: number; rowIds: number[] }[];
  window: WindowInfo;
  result: QueryResult;
  frames: Frame[];
}

function narrationPicker(authored?: LessonStep[]) {
  const used = new Set<number>();
  return (
    clause: SqlClause,
    fallback: { title: string; description: string },
  ): Frame => {
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

function rowId(cells: SqlValue[], fallbackIndex: number): number {
  const first = cells[0];
  return typeof first === "number" ? first : fallbackIndex;
}

function compareValues(a: SqlValue, b: SqlValue): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function resolveColumnIndex(columns: string[], expr: string): number {
  const base = expr
    .replace(/\s+as\s+\w+$/i, "")
    .trim()
    .split(".")
    .pop()!
    .replace(/["'`]/g, "")
    .trim()
    .toLowerCase();
  return columns.findIndex((c) => c.toLowerCase() === base);
}

export function buildCtePlan(
  db: SqlDatabase,
  a: CteAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): CteVizData | null {
  let inner: QueryResult;
  let outer: QueryResult;
  try {
    inner = db.exec(a.innerSql);
    outer = db.exec(rawQuery);
  } catch {
    return null;
  }

  const pick = narrationPicker(authored);
  const frames: Frame[] = [
    pick("WITH", {
      title: `Materialize CTE \`${a.name}\``,
      description: `Chạy truy vấn con → bảng tạm ${a.name} (${inner.rows.length} dòng).`,
    }),
    pick("FROM", {
      title: "Truy vấn ngoài dùng CTE",
      description: `Truy vấn bên ngoài đọc từ \`${a.name}\` như một bảng thật.`,
    }),
    pick("SELECT", {
      title: "Kết quả cuối",
      description: `Ra ${outer.rows.length} dòng sau khi chạy phần SELECT ngoài.`,
    }),
  ];

  return {
    kind: "cte",
    cteName: a.name,
    innerColumns: inner.columns,
    innerRows: inner.rows,
    outerResult: outer,
    frames,
  };
}

export function buildSubqueryPlan(
  db: SqlDatabase,
  a: SelectAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): SubqueryVizData | null {
  if (!a.from || !a.scalarSubquery || !a.where) return null;

  let scalarResult: QueryResult;
  let base: QueryResult;
  let result: QueryResult;
  try {
    scalarResult = db.exec(a.scalarSubquery);
    base = db.exec(`SELECT * FROM ${a.from.table}`);
    result = db.exec(rawQuery);
  } catch {
    return null;
  }

  const scalarValue: SqlValue =
    scalarResult.rows[0]?.[0] !== undefined ? scalarResult.rows[0][0] : null;

  // Re-evaluate pass using real WHERE (handles complex expressions).
  let passFlags: boolean[] = base.rows.map(() => false);
  try {
    const flagged = db.exec(
      `SELECT *, CASE WHEN (${a.where}) THEN 1 ELSE 0 END AS __pass FROM ${a.from.table}`,
    );
    passFlags = flagged.rows.map((r) => Boolean(r[r.length - 1]));
  } catch {
    /* keep false */
  }

  const rows = base.rows.map((cells, i) => ({
    id: rowId(cells, i),
    cells,
    pass: passFlags[i] ?? false,
  }));

  const pick = narrationPicker(authored);
  const frames: Frame[] = [
    pick("WHERE", {
      title: "Tính subquery trước",
      description: `Subquery trả về một giá trị: ${String(scalarValue)}.`,
    }),
    pick("FROM", {
      title: `Nạp bảng ${a.from.table}`,
      description: `Truy vấn ngoài đọc ${rows.length} dòng.`,
    }),
    pick("WHERE", {
      title: "Lọc bằng giá trị subquery",
      description: `Giữ các dòng thỏa điều kiện với giá trị ${String(scalarValue)}.`,
    }),
    pick("SELECT", {
      title: "Kết quả",
      description: `${result.rows.length} dòng sau khi lọc.`,
    }),
  ];

  return {
    kind: "subquery",
    table: a.from.table,
    columns: base.columns,
    rows,
    scalarValue,
    subquerySql: a.scalarSubquery,
    result,
    frames,
  };
}

export function buildWindowPlan(
  db: SqlDatabase,
  a: SelectAnalysis,
  rawQuery: string,
  authored?: LessonStep[],
): WindowVizData | null {
  if (!a.from || !a.window) return null;
  const win = a.window;

  let base: QueryResult;
  let result: QueryResult;
  try {
    base = a.where
      ? db.exec(`SELECT * FROM ${a.from.table} WHERE ${a.where}`)
      : db.exec(`SELECT * FROM ${a.from.table}`);
    result = db.exec(rawQuery);
  } catch {
    return null;
  }

  const partIdxs = win.partitionBy
    .map((p) => resolveColumnIndex(base.columns, p))
    .filter((i) => i >= 0);

  type Row = {
    id: number;
    cells: SqlValue[];
    partitionKey: string;
    rn: number;
  };

  const staged: Row[] = base.rows.map((cells, i) => ({
    id: rowId(cells, i),
    cells,
    partitionKey:
      partIdxs.length > 0
        ? partIdxs.map((pi) => String(cells[pi])).join(" | ")
        : "__ALL__",
    rn: 0,
  }));

  // Group + sort within partition, assign rn
  const byPart = new Map<string, Row[]>();
  for (const r of staged) {
    if (!byPart.has(r.partitionKey)) byPart.set(r.partitionKey, []);
    byPart.get(r.partitionKey)!.push(r);
  }

  for (const group of byPart.values()) {
    group.sort((ra, rb) => {
      for (const term of win.orderBy) {
        const ci = resolveColumnIndex(base.columns, term.expr);
        if (ci < 0) continue;
        let c = compareValues(ra.cells[ci], rb.cells[ci]);
        if (term.dir === "DESC") c = -c;
        if (c !== 0) return c;
      }
      return 0;
    });
    group.forEach((r, i) => {
      r.rn = i + 1;
    });
  }

  const rows = [...byPart.values()].flat();
  const partitions = [...byPart.keys()].map((key, i) => ({
    key,
    label: key === "__ALL__" ? "Tất cả" : key,
    colorIndex: i % 6,
    rowIds: byPart.get(key)!.map((r) => r.id),
  }));

  const pick = narrationPicker(authored);
  const frames: Frame[] = [
    pick("FROM", {
      title: `Nạp bảng ${a.from.table}`,
      description: `${rows.length} dòng sẵn sàng cho window function.`,
    }),
  ];
  if (win.partitionBy.length > 0) {
    frames.push(
      pick("OVER", {
        title: `PARTITION BY ${win.partitionBy.join(", ")}`,
        description: `Chia thành ${partitions.length} nhóm — mỗi nhóm một màu.`,
      }),
    );
  }
  frames.push(
    pick("OVER", {
      title: `${win.fn}() đánh số`,
      description:
        win.orderBy.length > 0
          ? `Trong mỗi partition, sắp theo ${win.orderBy.map((o) => `${o.expr} ${o.dir}`).join(", ")} rồi gán 1, 2, 3…`
          : "Gán số thứ tự trong mỗi partition.",
    }),
    pick("SELECT", {
      title: "Kết quả kèm cột xếp hạng",
      description: `Giữ nguyên ${result.rows.length} dòng, thêm cột ${win.fn}.`,
    }),
  );

  return {
    kind: "window",
    table: a.from.table,
    columns: base.columns,
    rows,
    partitions,
    window: win,
    result,
    frames,
  };
}
