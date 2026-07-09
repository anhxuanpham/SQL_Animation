"use client";

import * as React from "react";

import {
  createDatabase,
  SqlDatabase,
  SqlExecutionError,
  type QueryResult,
} from "@/lib/db/sql-engine";

export interface RunOutcome {
  result: QueryResult | null;
  error: {
    message: string;
    hint?: string;
    original: string;
  } | null;
}

export interface UseSqlDatabase {
  ready: boolean;
  loadError: string | null;
  /** Run SQL and return the outcome (also usable for silent checks). */
  run: (sql: string) => RunOutcome;
  /** Reset the sample database back to its seeded state. */
  reset: () => void;
  db: SqlDatabase | null;
}

/**
 * Loads sql.js and provisions a fresh, isolated database for the calling
 * component (e.g. one per lesson). Handles the async WASM load and exposes a
 * synchronous `run` once ready.
 */
export function useSqlDatabase(): UseSqlDatabase {
  const [db, setDb] = React.useState<SqlDatabase | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    let created: SqlDatabase | null = null;

    createDatabase()
      .then((instance) => {
        if (!active) return;
        created = instance;
        setDb(instance);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(
          err instanceof Error ? err.message : "Không khởi tạo được cơ sở dữ liệu",
        );
      });

    return () => {
      active = false;
      // Best-effort cleanup of the underlying wasm database.
      try {
        (created as unknown as { close?: () => void } | null)?.close?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const run = React.useCallback(
    (sql: string): RunOutcome => {
      if (!db) {
        return {
          result: null,
          error: {
            message: "Cơ sở dữ liệu chưa sẵn sàng, vui lòng đợi một chút.",
            original: "database not ready",
          },
        };
      }
      try {
        const result = db.exec(sql);
        return { result, error: null };
      } catch (err) {
        if (err instanceof SqlExecutionError) {
          return {
            result: null,
            error: {
              message: err.message,
              hint: err.hint,
              original: err.original,
            },
          };
        }
        return {
          result: null,
          error: {
            message: err instanceof Error ? err.message : "Lỗi không xác định",
            original: String(err),
          },
        };
      }
    },
    [db],
  );

  const reset = React.useCallback(() => {
    if (db) db.reset();
  }, [db]);

  return { ready: db !== null, loadError, run, reset, db };
}
