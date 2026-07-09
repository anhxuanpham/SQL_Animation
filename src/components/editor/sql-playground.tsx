"use client";

import * as React from "react";
import { Play, RotateCcw, Loader2, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SqlEditor } from "./sql-editor";
import { ResultTable, type ResultTableError } from "./result-table";
import type { QueryResult } from "@/lib/db/sql-engine";
import {
  guessErrorLine,
  type EditorErrorMarker,
} from "./code-mirror-editor";

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
}: SqlPlaygroundProps) {
  const markers: EditorErrorMarker[] | undefined = React.useMemo(() => {
    if (errorMarkers) return errorMarkers;
    if (!outcome?.error) return undefined;
    const line = guessErrorLine(query, outcome.error.original);
    return [{ line, message: outcome.error.message }];
  }, [errorMarkers, outcome, query]);

  return (
    <div className="space-y-3">
      <SqlEditor
        value={query}
        onChange={onQueryChange}
        onRun={onRun}
        errorMarkers={markers}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRun} disabled={!ready} className="gap-1.5">
          {ready ? (
            <Play className="size-4" />
          ) : (
            <Loader2 className="size-4 animate-spin" />
          )}
          {ready ? "Chạy truy vấn" : "Đang tải SQLite…"}
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
          Reset dữ liệu mẫu
        </Button>
        <span className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Database className="size-3" />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘/Ctrl + Enter
          </kbd>
          để chạy
        </span>
      </div>

      <ResultTable
        result={outcome?.result ?? null}
        error={outcome?.error ?? null}
        hasRun={hasRun}
      />
    </div>
  );
}
