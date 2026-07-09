"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import type { CteVizData } from "@/lib/visualizer/plan";
import type { SqlClause } from "@/lib/lessons/types";
import { formatValue, clauseVar } from "./shared";

export function CteVisualizer({
  data,
  activeClause,
}: {
  data: CteVizData;
  activeClause: SqlClause;
}) {
  const showInner = activeClause === "WITH" || activeClause === "FROM";
  const showOuter =
    activeClause === "FROM" ||
    activeClause === "SELECT" ||
    activeClause === "GROUP BY";
  const emphasizeOuter = activeClause === "SELECT" || activeClause === "GROUP BY";

  const renderTable = (
    title: string,
    columns: string[],
    rows: (string | number | null | Uint8Array)[][],
    accent: string,
  ) => {
    const grid = `repeat(${Math.max(columns.length, 1)}, minmax(4rem, 1fr))`;
    return (
      <div className="space-y-1.5">
        <p className="font-mono text-xs font-semibold" style={{ color: accent }}>
          {title}
        </p>
        <div className="overflow-x-auto rounded-lg border bg-card/40 p-2">
          <div className="min-w-fit space-y-1">
            <div
              className="grid gap-1 text-[11px] font-medium text-muted-foreground"
              style={{ gridTemplateColumns: grid }}
            >
              {columns.map((c) => (
                <div key={c} className="truncate px-2 py-1 font-mono">
                  {c}
                </div>
              ))}
            </div>
            {rows.map((row, ri) => (
              <motion.div
                key={ri}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.04 }}
                className="grid items-center gap-1 rounded-md border bg-card/60 text-[12px]"
                style={{ gridTemplateColumns: grid }}
              >
                {row.map((cell, ci) => (
                  <div key={ci} className="truncate px-2 py-1.5 font-mono">
                    {formatValue(cell)}
                  </div>
                ))}
              </motion.div>
            ))}
            {rows.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                (trống)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {showInner &&
        renderTable(
          `CTE · ${data.cteName} (${data.innerRows.length} dòng)`,
          data.innerColumns,
          data.innerRows,
          clauseVar("LIMIT"),
        )}

      {showInner && showOuter && (
        <div className="flex justify-center text-muted-foreground">
          <ArrowDown className="size-5" style={{ color: clauseVar("FROM") }} />
        </div>
      )}

      {showOuter &&
        renderTable(
          emphasizeOuter
            ? `Kết quả ngoài (${data.outerResult.rows.length} dòng)`
            : `Truy vấn ngoài FROM ${data.cteName}`,
          data.outerResult.columns,
          emphasizeOuter
            ? data.outerResult.rows
            : data.outerResult.rows.slice(0, 6),
          clauseVar(emphasizeOuter ? "SELECT" : "FROM"),
        )}
    </div>
  );
}
