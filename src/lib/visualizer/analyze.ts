/**
 * A small, forgiving SQL analyzer for visualization purposes only.
 *
 * It is NOT a full SQL parser. It classifies the statement and extracts the
 * clauses needed to drive the animated visualizers. The actual query is still
 * run by SQLite for correctness, so the analyzer only needs to be "good enough"
 * to decide how to animate. When it cannot confidently classify a query, the
 * visualizer falls back to a static (non-animated) view.
 */

export type StatementKind =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "other";

export interface TableRef {
  table: string;
  alias?: string;
}

export interface ColumnRef {
  qualifier?: string;
  column: string;
}

export interface JoinInfo {
  kind: "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS";
  right: TableRef;
  onLeft: ColumnRef;
  onRight: ColumnRef;
}

export interface OrderTerm {
  expr: string;
  dir: "ASC" | "DESC";
}

export interface WindowInfo {
  fn: string;
  partitionBy: string[];
  orderBy: OrderTerm[];
}

export interface SelectAnalysis {
  kind: "select";
  columnsRaw: string;
  isStar: boolean;
  isDistinct: boolean;
  from?: TableRef;
  joins: JoinInfo[];
  where?: string;
  groupBy: string[];
  having?: string;
  orderBy: OrderTerm[];
  limit?: number;
  /** True when SELECT list contains an aggregate function. */
  hasAggregate: boolean;
  hasWindow: boolean;
  window?: WindowInfo;
  /** Scalar subquery raw text inside WHERE, if any. */
  scalarSubquery?: string;
}

export interface CteAnalysis {
  kind: "cte";
  name: string;
  innerSql: string;
  outerSql: string;
}

export interface InsertAnalysis {
  kind: "insert";
  table: string;
  columns: string[];
  /** Each element is one row's raw value list. */
  valueRows: string[][];
}

export interface UpdateAnalysis {
  kind: "update";
  table: string;
  assignments: { column: string; value: string }[];
  where?: string;
}

export interface DeleteAnalysis {
  kind: "delete";
  table: string;
  where?: string;
}

export interface OtherAnalysis {
  kind: "other";
}

export type QueryAnalysis =
  | SelectAnalysis
  | InsertAnalysis
  | UpdateAnalysis
  | DeleteAnalysis
  | CteAnalysis
  | OtherAnalysis;

const AGG_RE = /\b(count|sum|avg|min|max|total|group_concat)\s*\(/i;

/** Strip line/block comments and collapse whitespace. */
function normalize(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;+\s*$/, "");
}

function parseColumnRef(raw: string): ColumnRef {
  const cleaned = raw.trim().replace(/["'`]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot >= 0) {
    return {
      qualifier: cleaned.slice(0, dot).trim(),
      column: cleaned.slice(dot + 1).trim(),
    };
  }
  return { column: cleaned };
}

function parseTableRef(raw: string): TableRef {
  const parts = raw.trim().split(/\s+(?:as\s+)?/i).filter(Boolean);
  if (parts.length >= 2) {
    return { table: parts[0].replace(/["'`]/g, ""), alias: parts[1].replace(/["'`]/g, "") };
  }
  return { table: parts[0]?.replace(/["'`]/g, "") ?? "" };
}

/** Split a top-level comma list, respecting parentheses depth. */
function splitTopLevel(input: string, sep = ","): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  let inStr = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'") inStr = !inStr;
    if (!inStr) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
    }
    if (ch === sep && depth === 0 && !inStr) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Find the index of a top-level keyword (depth 0, outside strings). Returns -1
 * if not found. `from` is a start offset.
 */
function findKeyword(sql: string, keyword: string, start = 0): number {
  const re = new RegExp(`\\b${keyword.replace(/ /g, "\\s+")}\\b`, "gi");
  re.lastIndex = start;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const idx = m.index;
    // depth check
    let depth = 0;
    let inStr = false;
    for (let i = 0; i < idx; i++) {
      const ch = sql[i];
      if (ch === "'") inStr = !inStr;
      else if (!inStr && ch === "(") depth++;
      else if (!inStr && ch === ")") depth--;
    }
    if (depth === 0 && !inStr) return idx;
  }
  return -1;
}

function extractMatchingParen(sql: string, openIdx: number): number {
  let depth = 0;
  let inStr = false;
  for (let i = openIdx; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") inStr = !inStr;
    if (inStr) continue;
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseWindowInfo(columnsRaw: string): WindowInfo | undefined {
  const overIdx = columnsRaw.search(/\bover\s*\(/i);
  if (overIdx < 0) return undefined;
  const open = columnsRaw.indexOf("(", overIdx);
  if (open < 0) return undefined;
  const close = extractMatchingParen(columnsRaw, open);
  if (close < 0) return undefined;
  const body = columnsRaw.slice(open + 1, close);
  const fnMatch = /([a-z_]+)\s*\(\s*\)\s*over/i.exec(columnsRaw.slice(0, overIdx + 4));
  const partition: string[] = [];
  const partM = /\bpartition\s+by\s+([^)]+?)(?=\border\b|$)/i.exec(body);
  if (partM) {
    for (const p of splitTopLevel(partM[1])) {
      if (p.trim()) partition.push(p.trim());
    }
  }
  const orderTerms: OrderTerm[] = [];
  const ordM = /\border\s+by\s+(.+)$/i.exec(body);
  if (ordM) {
    for (const term of splitTopLevel(ordM[1])) {
      const desc = /\bdesc\b/i.test(term);
      const expr = term.replace(/\b(asc|desc)\b/gi, "").trim();
      if (expr) orderTerms.push({ expr, dir: desc ? "DESC" : "ASC" });
    }
  }
  return {
    fn: fnMatch?.[1]?.toUpperCase() ?? "ROW_NUMBER",
    partitionBy: partition,
    orderBy: orderTerms,
  };
}

function extractScalarSubquery(where: string): string | undefined {
  // Find first top-level (SELECT ...)
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < where.length; i++) {
    const ch = where[i];
    if (ch === "'") inStr = !inStr;
    if (inStr) continue;
    if (ch === "(") {
      if (depth === 0) {
        const rest = where.slice(i + 1).trimStart();
        if (/^select\b/i.test(rest)) {
          const close = extractMatchingParen(where, i);
          if (close > i) return where.slice(i + 1, close).trim();
        }
      }
      depth++;
    } else if (ch === ")") depth = Math.max(0, depth - 1);
  }
  return undefined;
}

function analyzeSelect(sql: string): SelectAnalysis {
  const analysis: SelectAnalysis = {
    kind: "select",
    columnsRaw: "*",
    isStar: false,
    isDistinct: false,
    joins: [],
    groupBy: [],
    orderBy: [],
    hasAggregate: false,
    hasWindow: false,
  };

  // Clause boundaries (top-level).
  const idxFrom = findKeyword(sql, "FROM");
  const idxWhere = findKeyword(sql, "WHERE");
  const idxGroup = findKeyword(sql, "GROUP BY");
  const idxHaving = findKeyword(sql, "HAVING");
  const idxOrder = findKeyword(sql, "ORDER BY");
  const idxLimit = findKeyword(sql, "LIMIT");

  const selectStart = /^\s*select\b/i.exec(sql)?.[0].length ?? 6;
  const colsEnd = idxFrom >= 0 ? idxFrom : sql.length;
  let cols = sql.slice(selectStart, colsEnd).trim();
  if (/^distinct\b/i.test(cols)) {
    analysis.isDistinct = true;
    cols = cols.replace(/^distinct\s+/i, "").trim();
  }
  analysis.columnsRaw = cols;
  analysis.isStar = analysis.columnsRaw === "*";
  analysis.hasAggregate = AGG_RE.test(analysis.columnsRaw);
  analysis.window = parseWindowInfo(analysis.columnsRaw);
  analysis.hasWindow = Boolean(analysis.window);

  // FROM ... (up to next clause)
  if (idxFrom >= 0) {
    const boundaries = [idxWhere, idxGroup, idxHaving, idxOrder, idxLimit]
      .filter((i) => i > idxFrom)
      .sort((a, b) => a - b);
    const fromEnd = boundaries[0] ?? sql.length;
    const fromClause = sql.slice(idxFrom + 4, fromEnd).trim();
    parseFromAndJoins(fromClause, analysis);
  }

  if (idxWhere >= 0) {
    const boundaries = [idxGroup, idxHaving, idxOrder, idxLimit]
      .filter((i) => i > idxWhere)
      .sort((a, b) => a - b);
    const end = boundaries[0] ?? sql.length;
    analysis.where = sql.slice(idxWhere + 5, end).trim();
    analysis.scalarSubquery = extractScalarSubquery(analysis.where);
  }

  if (idxGroup >= 0) {
    const boundaries = [idxHaving, idxOrder, idxLimit]
      .filter((i) => i > idxGroup)
      .sort((a, b) => a - b);
    const end = boundaries[0] ?? sql.length;
    const raw = sql.slice(idxGroup + 8, end).trim();
    analysis.groupBy = splitTopLevel(raw).map((c) => c.trim());
  }

  if (idxHaving >= 0) {
    const boundaries = [idxOrder, idxLimit]
      .filter((i) => i > idxHaving)
      .sort((a, b) => a - b);
    const end = boundaries[0] ?? sql.length;
    analysis.having = sql.slice(idxHaving + 6, end).trim();
  }

  if (idxOrder >= 0) {
    const end = idxLimit > idxOrder ? idxLimit : sql.length;
    const raw = sql.slice(idxOrder + 8, end).trim();
    analysis.orderBy = splitTopLevel(raw).map((term) => {
      const desc = /\bdesc\b/i.test(term);
      const expr = term.replace(/\b(asc|desc)\b/gi, "").trim();
      return { expr, dir: desc ? "DESC" : "ASC" };
    });
  }

  if (idxLimit >= 0) {
    const m = /limit\s+(\d+)/i.exec(sql.slice(idxLimit));
    if (m) analysis.limit = parseInt(m[1], 10);
  }

  return analysis;
}

function parseFromAndJoins(fromClause: string, analysis: SelectAnalysis) {
  // Split on JOIN keywords, keeping the join type.
  const joinRe = /\b((?:inner|left|right|full|cross)\s+)?(?:outer\s+)?join\b/gi;
  const segments: { type: string; text: string }[] = [];
  let lastIndex = 0;
  let firstDone = false;
  let m: RegExpExecArray | null;
  let prevType = "";
  while ((m = joinRe.exec(fromClause))) {
    if (!firstDone) {
      segments.push({ type: "FROM", text: fromClause.slice(0, m.index) });
      firstDone = true;
    } else {
      segments.push({ type: prevType, text: fromClause.slice(lastIndex, m.index) });
    }
    prevType = (m[1] || "INNER").trim().toUpperCase() || "INNER";
    lastIndex = joinRe.lastIndex;
  }
  if (!firstDone) {
    segments.push({ type: "FROM", text: fromClause });
  } else {
    segments.push({ type: prevType, text: fromClause.slice(lastIndex) });
  }

  for (const seg of segments) {
    if (seg.type === "FROM") {
      analysis.from = parseTableRef(seg.text.trim());
    } else {
      // seg.text is "<table> ON a.x = b.y"
      const onIdx = findKeyword(seg.text, "ON");
      const tablePart = onIdx >= 0 ? seg.text.slice(0, onIdx) : seg.text;
      const onPart = onIdx >= 0 ? seg.text.slice(onIdx + 2) : "";
      const right = parseTableRef(tablePart.trim());
      const eq = onPart.split("=");
      const kind = (
        ["INNER", "LEFT", "RIGHT", "FULL", "CROSS"].includes(seg.type)
          ? seg.type
          : "INNER"
      ) as JoinInfo["kind"];
      analysis.joins.push({
        kind,
        right,
        onLeft: parseColumnRef(eq[0] ?? ""),
        onRight: parseColumnRef(eq[1] ?? ""),
      });
    }
  }
}

function analyzeInsert(sql: string): InsertAnalysis | OtherAnalysis {
  const m = /insert\s+into\s+([a-z0-9_]+)\s*\(([^)]*)\)\s*values\s*(.+)$/i.exec(sql);
  if (!m) return { kind: "other" };
  const table = m[1];
  const columns = splitTopLevel(m[2]).map((c) => c.trim().replace(/["'`]/g, ""));
  const valuesPart = m[3].trim();
  // Split into (...) groups.
  const rowMatches = valuesPart.match(/\(([^()]*)\)/g) ?? [];
  const valueRows = rowMatches.map((group) =>
    splitTopLevel(group.slice(1, -1)).map((v) => v.trim()),
  );
  return { kind: "insert", table, columns, valueRows };
}

function analyzeUpdate(sql: string): UpdateAnalysis | OtherAnalysis {
  const idxSet = findKeyword(sql, "SET");
  if (idxSet < 0) return { kind: "other" };
  const tableM = /update\s+([a-z0-9_]+)/i.exec(sql);
  if (!tableM) return { kind: "other" };
  const idxWhere = findKeyword(sql, "WHERE");
  const setEnd = idxWhere > idxSet ? idxWhere : sql.length;
  const setClause = sql.slice(idxSet + 3, setEnd).trim();
  const assignments = splitTopLevel(setClause).map((pair) => {
    const eq = pair.indexOf("=");
    return {
      column: pair.slice(0, eq).trim().replace(/["'`]/g, ""),
      value: pair.slice(eq + 1).trim(),
    };
  });
  const where = idxWhere >= 0 ? sql.slice(idxWhere + 5).trim() : undefined;
  return { kind: "update", table: tableM[1], assignments, where };
}

function analyzeDelete(sql: string): DeleteAnalysis | OtherAnalysis {
  const tableM = /delete\s+from\s+([a-z0-9_]+)/i.exec(sql);
  if (!tableM) return { kind: "other" };
  const idxWhere = findKeyword(sql, "WHERE");
  const where = idxWhere >= 0 ? sql.slice(idxWhere + 5).trim() : undefined;
  return { kind: "delete", table: tableM[1], where };
}

/** Classify the statement kind quickly (used to pick a visualizer). */
export function detectStatementKind(sql: string): StatementKind {
  const n = normalize(sql).toLowerCase();
  if (/^with\b/.test(n)) return n.includes("select") ? "select" : "other";
  if (/^select\b/.test(n)) return "select";
  if (/^insert\b/.test(n)) return "insert";
  if (/^update\b/.test(n)) return "update";
  if (/^delete\b/.test(n)) return "delete";
  return "other";
}

function analyzeCte(sql: string): CteAnalysis | OtherAnalysis {
  // Single non-recursive CTE: WITH name AS (inner) outer
  const m = /^with\s+([a-z0-9_]+)\s+as\s*\(/i.exec(sql);
  if (!m) return { kind: "other" };
  const name = m[1];
  const parenOpen = (m.index ?? 0) + m[0].length - 1;
  if (sql[parenOpen] !== "(") return { kind: "other" };
  const parenClose = extractMatchingParen(sql, parenOpen);
  if (parenClose < 0) return { kind: "other" };
  const innerSql = sql.slice(parenOpen + 1, parenClose).trim();
  const outerSql = sql.slice(parenClose + 1).trim();
  if (!innerSql || !outerSql) return { kind: "other" };
  // Multiple CTEs (comma after first) — out of scope for now
  if (/^,\s*[a-z0-9_]+\s+as\s*\(/i.test(outerSql)) return { kind: "other" };
  return { kind: "cte", name, innerSql, outerSql };
}

/**
 * Analyze a single SQL statement. Returns `{ kind: "other" }` when the query is
 * outside the supported patterns (DDL, multi-CTE, etc.).
 */
export function analyzeQuery(sql: string): QueryAnalysis {
  const n = normalize(sql);
  const lower = n.toLowerCase();

  if (splitTopLevel(n, ";").length > 1) return { kind: "other" };
  if (/^with\b/i.test(lower)) return analyzeCte(n);

  if (/^select\b/i.test(lower)) {
    return analyzeSelect(n);
  }
  if (/^insert\b/i.test(lower)) return analyzeInsert(n);
  if (/^update\b/i.test(lower)) return analyzeUpdate(n);
  if (/^delete\b/i.test(lower)) return analyzeDelete(n);
  return { kind: "other" };
}

/** Why a query cannot be animated (shown in the static fallback UI). */
export type AnimationBlockReason =
  | "empty"
  | "cte"
  | "multi_statement"
  | "ddl_or_other"
  | "window"
  | "plan_failed"
  | "conceptual";

const BLOCK_MESSAGES: Record<AnimationBlockReason, string> = {
  empty: "Chưa có câu lệnh để mô phỏng.",
  cte: "CTE (WITH …) chưa có animation chi tiết — kết quả vẫn chạy được bên dưới.",
  multi_statement:
    "Nhiều câu lệnh trong một lần chạy chưa được mô phỏng từng bước.",
  ddl_or_other:
    "Loại câu lệnh này (DDL / đặc biệt) chưa hỗ trợ animation pipeline.",
  window:
    "Window function (OVER …) chưa có animation riêng — xem kết quả thực thi bên dưới.",
  plan_failed:
    "Không dựng được các bước animation từ câu lệnh này (cấu trúc phức tạp hoặc thiếu bảng).",
  conceptual:
    "Bài học mang tính khái niệm — animation chi tiết không bắt buộc. Bạn vẫn có thể chạy SQL tự do.",
};

/**
 * Classify why animation is unavailable. Call after analyze/plan fails so the
 * UI can explain the fallback instead of a generic message.
 */
export function explainAnimationBlock(sql: string): {
  reason: AnimationBlockReason;
  message: string;
} {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { reason: "empty", message: BLOCK_MESSAGES.empty };
  }
  const n = normalize(trimmed);
  const lower = n.toLowerCase();

  if (splitTopLevel(n, ";").length > 1) {
    return { reason: "multi_statement", message: BLOCK_MESSAGES.multi_statement };
  }
  // CTE / window are animated when the analyzer can parse them; only block
  // multi-CTE or unparseable forms (handled via plan_failed).
  if (
    /^(create|drop|alter|begin|commit|rollback|pragma|explain|attach|detach)\b/i.test(
      lower,
    )
  ) {
    return { reason: "ddl_or_other", message: BLOCK_MESSAGES.ddl_or_other };
  }

  return { reason: "plan_failed", message: BLOCK_MESSAGES.plan_failed };
}
