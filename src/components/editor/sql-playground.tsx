"use client";

import * as React from "react";
import {
  Play,
  RotateCcw,
  Loader2,
  Database,
  Workflow,
  Info,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SqlEditor } from "./sql-editor";
import { ResultTable, type ResultTableError } from "./result-table";
import type { QueryResult } from "@/lib/db/sql-engine";
import {
  guessErrorLine,
  type EditorErrorMarker,
} from "./code-mirror-editor";
import type { SqlDialect } from "@/lib/lessons/types";

export interface PlaygroundOutcome {
  result: QueryResult | null;
  error: ResultTableError | null;
}

interface SqlPlaygroundProps {
  query: string;
  onQueryChange: (query: string) => void;
  onRun: () => void;
  onReset: () => void;
  outcome: PlaygroundOutcome | null;
  hasRun: boolean;
  ready: boolean;
  resetting?: boolean;
  /** Optional external markers; auto-derived from outcome.error if omitted. */
  errorMarkers?: EditorErrorMarker[];
  dialect?: SqlDialect;
}

export function SqlPlayground({
  query,
  onQueryChange,
  onRun,
  onReset,
  outcome,
  hasRun,
  ready,
  resetting = false,
  errorMarkers,
  dialect = "sqlite",
}: SqlPlaygroundProps) {
  const isOracle = dialect === "oracle";
  const markers: EditorErrorMarker[] | undefined = React.useMemo(() => {
    if (errorMarkers) return errorMarkers;
    if (!outcome?.error) return undefined;
    const line = guessErrorLine(query, outcome.error.original);
    return [{ line, message: outcome.error.message }];
  }, [errorMarkers, outcome, query]);

  return (
    <div className="space-y-3">
      {isOracle && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/35 bg-warning/5 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            <strong className="font-medium text-foreground">Oracle PL/SQL.</strong>{" "}
            Browser không có Oracle Server; editor dùng dialect PL/SQL và nút
            bên dưới chạy mô phỏng trên dữ liệu mẫu.
          </p>
        </div>
      )}

      <SqlEditor
        value={query}
        onChange={onQueryChange}
        onRun={onRun}
        errorMarkers={markers}
        dialect={dialect}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRun} disabled={!ready} className="gap-1.5">
          {ready ? (
            isOracle ? (
              <Workflow className="size-4" />
            ) : (
              <Play className="size-4" />
            )
          ) : (
            <Loader2 className="size-4 animate-spin" />
          )}
          {ready
            ? isOracle
              ? "Mô phỏng PL/SQL"
              : "Chạy truy vấn"
            : "Đang tải dữ liệu…"}
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          disabled={!ready || resetting}
          className="gap-1.5"
        >
          {resetting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          {isOracle ? "Khôi phục ví dụ" : "Reset dữ liệu mẫu"}
        </Button>
        <span className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Database className="size-3" />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘/Ctrl + Enter
          </kbd>
          để {isOracle ? "mô phỏng" : "chạy"}
        </span>
      </div>

      {isOracle ? (
        <div className="flex min-h-[96px] items-center justify-center rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          {hasRun ? (
            <span className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="size-4 text-success" />
              Đã cập nhật trình mô phỏng theo đoạn PL/SQL trong editor.
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Workflow className="size-4" />
              Bấm Mô phỏng PL/SQL để xem procedure chạy từng bước.
            </span>
          )}
        </div>
      ) : (
        <ResultTable
          result={outcome?.result ?? null}
          error={outcome?.error ?? null}
          hasRun={hasRun}
        />
      )}
    </div>
  );
}
