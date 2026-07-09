"use client";

import * as React from "react";
import { AlertCircle, Table2, CheckCircle2, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { QueryResult, SqlValue } from "@/lib/db/sql-engine";

export interface ResultTableError {
  message: string;
  hint?: string;
  original: string;
}

interface ResultTableProps {
  result: QueryResult | null;
  error: ResultTableError | null;
  /** Show a placeholder before the first run. */
  hasRun?: boolean;
  className?: string;
  maxRows?: number;
}

function formatCell(value: SqlValue): React.ReactNode {
  if (value === null) {
    return <span className="text-muted-foreground/70 italic">NULL</span>;
  }
  if (value instanceof Uint8Array) {
    return <span className="text-muted-foreground">blob({value.length}B)</span>;
  }
  return String(value);
}

export function ResultTable({
  result,
  error,
  hasRun = false,
  className,
  maxRows = 500,
}: ResultTableProps) {
  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm",
          className,
        )}
        role="alert"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="space-y-1.5">
            <p className="font-medium text-destructive">{error.message}</p>
            {error.hint && (
              <p className="text-muted-foreground">💡 {error.hint}</p>
            )}
            <details className="text-xs text-muted-foreground/80">
              <summary className="cursor-pointer select-none hover:text-foreground">
                Chi tiết lỗi kỹ thuật
              </summary>
              <code className="mt-1 block font-mono break-words">
                {error.original}
              </code>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className={cn(
          "flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        <Table2 className="size-5 opacity-60" />
        <p>{hasRun ? "Không có kết quả." : "Chạy truy vấn để xem kết quả tại đây."}</p>
      </div>
    );
  }

  // Non-SELECT statement (INSERT/UPDATE/DELETE/DDL): no columns returned.
  if (result.columns.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-success/40 bg-success/5 p-4 text-sm",
          className,
        )}
      >
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <span>
          Thực thi thành công.{" "}
          <strong className="font-medium">
            {result.rowsModified}
          </strong>{" "}
          dòng bị thay đổi.
        </span>
      </div>
    );
  }

  const rows = result.rows.slice(0, maxRows);
  const truncated = result.rows.length > maxRows;

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr>
              <th className="border-b px-3 py-2 text-left font-mono text-xs font-medium text-muted-foreground">
                #
              </th>
              {result.columns.map((col, i) => (
                <th
                  key={i}
                  className="border-b px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b last:border-0 odd:bg-muted/20 hover:bg-accent/40"
              >
                <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5 font-mono text-[13px] whitespace-nowrap"
                  >
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        <span>
          {result.rows.length} dòng × {result.columns.length} cột
          {truncated && ` (hiển thị ${maxRows} dòng đầu)`}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {result.elapsedMs.toFixed(1)} ms
        </span>
      </div>
    </div>
  );
}
