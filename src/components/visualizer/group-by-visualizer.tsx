"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { GroupVizData } from "@/lib/visualizer/plan";
import type { SqlClause } from "@/lib/lessons/types";
import type { SqlValue } from "@/lib/db/sql-engine";
import { cn } from "@/lib/utils";
import { formatValue } from "./shared";

const GROUP_COLORS = [
  "var(--clause-select)",
  "var(--clause-from)",
  "var(--clause-where)",
  "var(--clause-groupby)",
  "var(--clause-join)",
  "var(--clause-having)",
];

function CountUp({ to, active }: { to: number; active: boolean }) {
  const [val, setVal] = React.useState(active ? 0 : to);
  React.useEffect(() => {
    if (!active) {
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 650;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(p * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return <>{val}</>;
}

function AggregateValue({ value, active }: { value: SqlValue; active: boolean }) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? (
      <CountUp to={value} active={active} />
    ) : (
      <>{value.toFixed(2)}</>
    );
  }
  return <>{formatValue(value)}</>;
}

export function GroupByVisualizer({
  data,
  activeClause,
}: {
  data: GroupVizData;
  activeClause: SqlClause;
}) {
  const grouped = activeClause !== "FROM";
  const showAgg = activeClause === "SELECT" || activeClause === "HAVING";
  const applyHaving = activeClause === "HAVING";

  const cellById = React.useMemo(() => {
    const m = new Map<number, SqlValue[]>();
    for (const r of data.rows) m.set(r.id, r.cells);
    return m;
  }, [data.rows]);

  // Choose a compact label column for member chips (prefer a "name" column).
  const displayCol = React.useMemo(() => {
    const idx = data.columns.findIndex((c) => /name/i.test(c));
    return idx >= 0 ? idx : 0;
  }, [data.columns]);

  // Match aggregated result rows to group keys for accurate values.
  const resultByKey = React.useMemo(() => {
    const m = new Map<string, SqlValue[]>();
    if (data.groupColumnIndex >= 0) {
      for (const r of data.result.rows) m.set(String(r[0]), r);
    }
    return m;
  }, [data.result, data.groupColumnIndex]);

  if (!grouped) {
    // FROM stage: flat list before grouping.
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {data.rows.length} dòng của bảng {data.table} — chưa gom nhóm
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.rows.map((r) => (
            <motion.span
              key={r.id}
              layout
              className="rounded-md border bg-card/60 px-2 py-1 font-mono text-[11px]"
            >
              {formatValue(r.cells[displayCol])}
            </motion.span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {data.groups.map((group) => {
        const color = GROUP_COLORS[group.colorIndex % GROUP_COLORS.length];
        const dim = applyHaving && !group.passesHaving;
        const aggRow =
          data.groupColumnIndex >= 0
            ? resultByKey.get(group.key)
            : data.result.rows[0];
        return (
          <motion.div
            key={group.key}
            layout
            animate={{ opacity: dim ? 0.3 : 1, scale: dim ? 0.97 : 1 }}
            className={cn(
              "min-w-[140px] flex-1 rounded-lg border-2 p-2.5",
              dim && "grayscale",
            )}
            style={{
              borderColor: color,
              backgroundColor: `color-mix(in oklab, ${color} 8%, transparent)`,
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className="truncate font-mono text-xs font-semibold"
                style={{ color }}
              >
                {group.label}
              </span>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>

            <div className="mb-2 flex flex-wrap gap-1">
              <AnimatePresence>
                {group.rowIds.map((id) => (
                  <motion.span
                    key={id}
                    layoutId={`grouprow-${id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded bg-background/70 px-1.5 py-0.5 font-mono text-[10px]"
                  >
                    {formatValue(cellById.get(id)?.[displayCol] ?? id)}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {showAgg && aggRow && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border bg-background/80 px-2 py-1.5"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {data.result.columns.map((col, ci) => (
                    <span key={col} className="font-mono text-[11px]">
                      <span className="text-muted-foreground">{col}: </span>
                      <span className="font-semibold" style={{ color }}>
                        <AggregateValue value={aggRow[ci]} active={showAgg} />
                      </span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {!showAgg && (
              <div className="text-[11px] text-muted-foreground">
                {group.count} dòng
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
