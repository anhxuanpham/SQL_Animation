"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { SelectVizData, VizRow } from "@/lib/visualizer/plan";
import type { SqlClause } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";
import { formatValue, clauseVar } from "./shared";

export function TableVisualizer({
  data,
  activeClause,
  step = 0,
}: {
  data: SelectVizData;
  activeClause: SqlClause;
  /** Frame index — needed when two frames share SELECT (projection vs DISTINCT). */
  step?: number;
}) {
  // Map frame index to pipeline stage based on which frames exist.
  const stage = React.useMemo(() => {
    // Reconstruct stage from clause + step heuristics
    if (activeClause === "FROM") return 0;
    if (activeClause === "WHERE") return 1;
    if (activeClause === "SELECT") {
      // First SELECT frame = project; later SELECT (distinct) = dedupe
      const selectFrames = data.frames
        .map((f, i) => ({ f, i }))
        .filter(({ f }) => f.clause === "SELECT");
      if (selectFrames.length > 1 && step === selectFrames[1]?.i) return 2.5;
      return 2;
    }
    if (activeClause === "ORDER BY") return 3;
    if (activeClause === "LIMIT") return 4;
    return 0;
  }, [activeClause, step, data.frames]);

  const showAll = stage <= 1;
  const projected = stage >= 2;
  const distincting = stage >= 2.5 && data.isDistinct;
  const ordered = stage >= 3;
  const limited = stage >= 4;
  const filtering = activeClause === "WHERE";
  const dupSet = React.useMemo(
    () => new Set(data.duplicateIds ?? []),
    [data.duplicateIds],
  );

  const displayRows: VizRow[] = React.useMemo(() => {
    if (showAll) return data.rows;
    let passing = data.rows.filter((r) => r.pass);
    if (ordered || distincting) {
      const byId = new Map(passing.map((r) => [r.id, r]));
      passing = data.orderedIds
        .map((id) => byId.get(id))
        .filter((r): r is VizRow => Boolean(r));
    }
    if (distincting) {
      // Keep dups visible but we'll dim them; if past distinct, drop them
      // At distinct stage show all with dim; after order/limit exclude dups
    }
    if (ordered && data.isDistinct) {
      passing = passing.filter((r) => !dupSet.has(r.id));
    }
    if (limited && data.limit != null) passing = passing.slice(0, data.limit);
    return passing;
  }, [showAll, ordered, limited, distincting, data, dupSet]);

  const gridTemplate = `2.2rem repeat(${data.columns.length}, minmax(4.5rem, 1fr))`;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-fit space-y-1">
          {/* Header */}
          <div
            className="grid gap-1 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="px-2 py-1" />
            {data.columns.map((col, ci) => {
              const kept = data.keptColumns.includes(ci);
              const dimmed = projected && !kept;
              return (
                <motion.div
                  key={col}
                  animate={{ opacity: dimmed ? 0.28 : 1 }}
                  className="truncate rounded px-2 py-1 font-mono"
                  style={
                    projected && kept
                      ? { color: clauseVar("SELECT") }
                      : undefined
                  }
                >
                  {col}
                </motion.div>
              );
            })}
          </div>

          {/* Rows */}
          <AnimatePresence mode="popLayout" initial={false}>
            {displayRows.map((row) => {
              const failing = filtering && !row.pass;
              const passingHi = filtering && row.pass;
              const isDup = distincting && dupSet.has(row.id);
              return (
                <motion.div
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: failing || isDup ? 0.3 : 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className={cn(
                    "grid items-center gap-1 rounded-md border text-[13px]",
                    failing && "border-destructive/50",
                    passingHi && "border-success/50",
                    isDup && "border-dashed border-muted-foreground/40 line-through",
                    !filtering && !isDup && "border-border",
                  )}
                  style={{
                    gridTemplateColumns: gridTemplate,
                    backgroundColor: failing
                      ? "color-mix(in oklab, var(--destructive) 12%, transparent)"
                      : passingHi
                        ? "color-mix(in oklab, var(--success) 12%, transparent)"
                        : "color-mix(in oklab, var(--card) 60%, transparent)",
                  }}
                >
                  <div className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {row.id}
                  </div>
                  {row.cells.map((cell, ci) => {
                    const kept = data.keptColumns.includes(ci);
                    const dimmed = projected && !kept;
                    return (
                      <motion.div
                        key={ci}
                        animate={{ opacity: dimmed ? 0.25 : 1 }}
                        className={cn(
                          "truncate px-2 py-1.5 font-mono",
                          cell === null && "text-muted-foreground/60 italic",
                        )}
                      >
                        {formatValue(cell)}
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {showAll
          ? `${data.rows.length} dòng trong bảng ${data.table}`
          : `${displayRows.length} dòng ${limited ? "(sau LIMIT)" : ordered ? "(đã sắp xếp)" : "còn lại"}`}
      </p>
    </div>
  );
}
