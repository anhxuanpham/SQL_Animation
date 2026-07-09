/**
 * Client-side SQLite engine backed by sql.js (SQLite compiled to WebAssembly).
 *
 * Design notes:
 * - sql.js is loaded at runtime from `/public/sqljs` via a <script> tag rather
 *   than bundled. This sidesteps Turbopack trying to resolve Node built-ins
 *   (`fs`, `path`) referenced in the Emscripten glue code, and keeps the wasm
 *   out of the JS bundle.
 * - Only type imports are used from the "sql.js" package (erased at compile
 *   time), so no runtime dependency is bundled.
 * - Everything here runs in the browser only. Guard callers with effects.
 */

import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import { SEED_SQL } from "./seed";

declare global {
  interface Window {
    initSqlJs?: (config?: {
      locateFile?: (file: string) => string;
    }) => Promise<SqlJsStatic>;
  }
}

export type { SqlValue };

export interface QueryResult {
  columns: string[];
  rows: SqlValue[][];
  /** Rows changed by INSERT/UPDATE/DELETE (0 for pure SELECT). */
  rowsModified: number;
  /** Execution time in milliseconds. */
  elapsedMs: number;
}

export class SqlExecutionError extends Error {
  original: string;
  hint?: string;

  constructor(message: string, original: string, hint?: string) {
    super(message);
    this.name = "SqlExecutionError";
    this.original = original;
    this.hint = hint;
  }
}

const SQLJS_SCRIPT_SRC = "/sqljs/sql-wasm.js";
const SQLJS_WASM_SRC = "/sqljs/sql-wasm.wasm";

let sqlModulePromise: Promise<SqlJsStatic> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("sql.js can only be loaded in the browser"));
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error(`Không tải được ${src}`)),
        );
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () =>
      reject(new Error(`Không tải được ${src}`)),
    );
    document.head.appendChild(script);
  });
}

/** Loads (and caches) the sql.js WASM module. */
export async function loadSqlJs(): Promise<SqlJsStatic> {
  if (sqlModulePromise) return sqlModulePromise;

  sqlModulePromise = (async () => {
    await loadScript(SQLJS_SCRIPT_SRC);
    if (!window.initSqlJs) {
      throw new Error("initSqlJs không khả dụng sau khi tải sql.js");
    }
    return window.initSqlJs({ locateFile: () => SQLJS_WASM_SRC });
  })();

  return sqlModulePromise;
}

/** Map a raw sqlite error message to a friendlier Vietnamese hint. */
function friendlyError(raw: string): { message: string; hint?: string } {
  const lower = raw.toLowerCase();

  if (lower.includes("syntax error")) {
    return {
      message: "Câu lệnh SQL có lỗi cú pháp.",
      hint: "Kiểm tra lại từ khóa, dấu phẩy và dấu chấm phẩy. Ví dụ SELECT viết đúng chính tả chưa?",
    };
  }
  if (lower.includes("no such table")) {
    const table = raw.split(":").pop()?.trim();
    return {
      message: `Không tìm thấy bảng ${table ? `"${table}"` : ""}.`,
      hint: "Các bảng có sẵn: users, orders, departments, employees.",
    };
  }
  if (lower.includes("no such column")) {
    const col = raw.split(":").pop()?.trim();
    return {
      message: `Không tìm thấy cột ${col ? `"${col}"` : ""}.`,
      hint: "Kiểm tra tên cột, hoặc dùng tiền tố bảng như users.name khi JOIN.",
    };
  }
  if (lower.includes("unrecognized token")) {
    return {
      message: "Có ký tự không hợp lệ trong câu lệnh.",
      hint: "Xóa các ký tự lạ và kiểm tra dấu nháy chuỗi.",
    };
  }
  if (lower.includes("datatype mismatch") || lower.includes("constraint")) {
    return {
      message: "Dữ liệu vi phạm ràng buộc của bảng.",
      hint: "Kiểm tra kiểu dữ liệu và khóa chính/khóa ngoại.",
    };
  }
  return { message: raw };
}

/**
 * Wrapper around a single in-memory SQLite database instance.
 */
export class SqlDatabase {
  private db: Database;
  private SQL: SqlJsStatic;

  constructor(SQL: SqlJsStatic) {
    this.SQL = SQL;
    this.db = new SQL.Database();
    this.seed();
  }

  private seed() {
    this.db.run(SEED_SQL);
  }

  /** Drop everything and re-run the seed script. */
  reset() {
    this.db.close();
    this.db = new this.SQL.Database();
    this.seed();
  }

  /** Free the underlying WASM database. Call when discarding the instance. */
  close() {
    try {
      this.db.close();
    } catch {
      /* already closed */
    }
  }

  /**
   * Execute arbitrary SQL (may contain multiple statements). Returns the last
   * result set produced, plus number of rows modified. Throws
   * `SqlExecutionError` with a friendly message on failure.
   */
  exec(sql: string): QueryResult {
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      const results = this.db.exec(sql);
      const rowsModified = this.db.getRowsModified();
      const end =
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const last = results[results.length - 1];
      if (!last) {
        return {
          columns: [],
          rows: [],
          rowsModified,
          elapsedMs: end - start,
        };
      }
      return {
        columns: last.columns,
        rows: last.values,
        rowsModified,
        elapsedMs: end - start,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const { message, hint } = friendlyError(raw);
      throw new SqlExecutionError(message, raw, hint);
    }
  }

  /** Convenience: read an entire table for static previews. */
  readTable(table: string): QueryResult {
    return this.exec(`SELECT * FROM ${table};`);
  }
}

let dbInstance: SqlDatabase | null = null;

/** Get (creating if needed) a shared database instance. */
export async function getDatabase(): Promise<SqlDatabase> {
  if (dbInstance) return dbInstance;
  const SQL = await loadSqlJs();
  dbInstance = new SqlDatabase(SQL);
  return dbInstance;
}

/**
 * Create a brand-new, isolated database instance. Each lesson uses its own so
 * that mutations (INSERT/UPDATE/DELETE) in one lesson never leak into another.
 */
export async function createDatabase(): Promise<SqlDatabase> {
  const SQL = await loadSqlJs();
  return new SqlDatabase(SQL);
}
