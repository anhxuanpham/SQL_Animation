"use client";

import * as React from "react";
import { motion } from "framer-motion";

import type { WindowVizData } from "@/lib/visualizer/plan";
import type { SqlClause } from "@/lib/lessons/types";
import type { SqlValue } from "@/lib/db/sql-engine";
import { formatValue, clauseVar } from "./shared";

const COLORS = [
  "var(--clause-select)",
  "var(--clause-from)",
  "var(--clause-where)",
  "var(--clause-groupby)",
  "var(--clause-join)",
  "var(--clause-having)",
];

export function WindowVisualizer({
  data,
  activeClause,
  step,
}: {
  data: WindowVizData;
  activeClause: SqlClause;
  step: number;
}) {
  // Frames: FROM, OVER partition, OVER number, SELECT
  const partitioned = step >= 1;
  const numbered = step >= 2;
  const showResult = step >= 3 || activeClause === "SELECT";

  const displayCol = React.useMemo(() => {
    const idx = data.columns.findIndex((c) => /name/i.test(c));
    return idx >= 0 ? idx : Math.min(1, data.columns.length - 1);
  }, [data.columns]);

  if (showResult && data.result.columns.length > 0) {
    const grid = `repeat(${data.result.columns.length}, minmax(4rem, 1fr))`;
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: clauseVar("SELECT") }}>
          Kết quả kèm {data.window.fn} ({data.result.rows.length} dòng)
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-fit space-y-1">
            <div
              className="grid gap-1 text-[11px] text-muted-foreground"
              style={{ gridTemplateColumns: grid }}
            >
              {data.result.columns.map((c) => (
                <div key={c} className="truncate px-2 py-1 font-mono">
                  {c}
                </div>
              ))}
            </div>
            {data.result.rows.map((row, ri) => (
              <motion.div
                key={ri}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.03 }}
                className="grid gap-1 rounded-md border bg-card/60 text-[12px]"
                style={{ gridTemplateColumns: grid }}
              >
                {row.map((cell, ci) => (
                  <div key={ci} className="truncate px-2 py-1.5 font-mono">
                    {formatValue(cell as SqlValue)}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!partitioned) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {data.rows.map((r) => (
          <div
            key={r.id}
            className="rounded-md border bg-card/60 px-2 py-1 font-mono text-xs"
          >
            {formatValue(r.cells[displayCol])}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.partitions.map((p) => {
        const color = COLORS[p.colorIndex % COLORS.length];
        const members = data.rows.filter((r) => r.partitionKey === p.key);
        return (
          <div
            key={p.key}
            className="rounded-lg border p-3"
            style={{
              borderColor: color,
              backgroundColor: `color-mix(in oklab, ${color} 8%, transparent)`,
            }}
          >
            <p className="mb-2 text-xs font-semibold" style={{ color }}>
              {p.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {members.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  className="flex items-center gap-1.5 rounded-md border bg-card/80 px-2 py-1 font-mono text-xs"
                >
                  <span>{formatValue(r.cells[displayCol])}</span>
                  {numbered && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {r.rn}
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
