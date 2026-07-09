"use client";

import * as React from "react";
import { motion } from "framer-motion";

import type { SubqueryVizData } from "@/lib/visualizer/plan";
import type { SqlClause } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";
import { formatValue, clauseVar } from "./shared";

export function SubqueryVisualizer({
  data,
  step,
}: {
  data: SubqueryVizData;
  step: number;
}) {
  // 0: bubble, 1: load table, 2: filter, 3: result
  const showBubble = step >= 0;
  const showTable = step >= 1;
  const filtering = step === 2;
  const showResult = step >= 3;

  const grid = `repeat(${data.columns.length}, minmax(4rem, 1fr))`;
  const displayRows =
    filtering || showResult
      ? data.rows.filter((r) => (showResult ? r.pass : true))
      : data.rows;

  return (
    <div className="space-y-4">
      {showBubble && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto max-w-md rounded-xl border-2 p-4 text-center shadow-sm"
          style={{
            borderColor: clauseVar("WHERE"),
            backgroundColor:
              "color-mix(in oklab, var(--clause-where) 12%, transparent)",
          }}
        >
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Subquery
          </p>
          <pre className="mt-1 overflow-x-auto font-mono text-[11px] text-muted-foreground">
            {data.subquerySql}
          </pre>
          <p
            className="mt-2 text-2xl font-bold tabular-nums"
            style={{ color: clauseVar("WHERE") }}
          >
            {formatValue(data.scalarValue)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Giá trị dùng cho WHERE bên ngoài
          </p>
        </motion.div>
      )}

      {showTable && !showResult && (
        <div className="overflow-x-auto">
          <p className="mb-1.5 font-mono text-xs font-semibold">
            {data.table}
          </p>
          <div className="min-w-fit space-y-1">
            <div
              className="grid gap-1 text-[11px] text-muted-foreground"
              style={{ gridTemplateColumns: grid }}
            >
              {data.columns.map((c) => (
                <div key={c} className="truncate px-2 py-1 font-mono">
                  {c}
                </div>
              ))}
            </div>
            {displayRows.map((row) => {
              const fail = filtering && !row.pass;
              const ok = filtering && row.pass;
              return (
                <motion.div
                  key={row.id}
                  layout
                  animate={{ opacity: fail ? 0.3 : 1 }}
                  className={cn(
                    "grid items-center gap-1 rounded-md border text-[12px]",
                    fail && "border-destructive/40",
                    ok && "border-success/50",
                  )}
                  style={{
                    gridTemplateColumns: grid,
                    backgroundColor: ok
                      ? "color-mix(in oklab, var(--success) 12%, transparent)"
                      : fail
                        ? "color-mix(in oklab, var(--destructive) 10%, transparent)"
                        : undefined,
                  }}
                >
                  {row.cells.map((cell, ci) => (
                    <div key={ci} className="truncate px-2 py-1.5 font-mono">
                      {formatValue(cell)}
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {showResult && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium" style={{ color: clauseVar("SELECT") }}>
            Kết quả ({data.result.rows.length} dòng)
          </p>
          <div className="overflow-x-auto">
            <div className="min-w-fit space-y-1">
              <div
                className="grid gap-1 text-[11px] text-muted-foreground"
                style={{
                  gridTemplateColumns: `repeat(${data.result.columns.length}, minmax(4rem, 1fr))`,
                }}
              >
                {data.result.columns.map((c) => (
                  <div key={c} className="truncate px-2 py-1 font-mono">
                    {c}
                  </div>
                ))}
              </div>
              {data.result.rows.map((row, ri) => (
                <div
                  key={ri}
                  className="grid gap-1 rounded-md border bg-card/60 text-[12px]"
                  style={{
                    gridTemplateColumns: `repeat(${data.result.columns.length}, minmax(4rem, 1fr))`,
                  }}
                >
                  {row.map((cell, ci) => (
                    <div key={ci} className="truncate px-2 py-1.5 font-mono">
                      {formatValue(cell)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
