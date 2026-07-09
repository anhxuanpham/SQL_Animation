"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { JoinVizData } from "@/lib/visualizer/plan";
import type { SqlClause } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";
import { formatValue, clauseVar } from "./shared";

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
}

type RowRole = "matched" | "unmatched-keep" | "unmatched-drop" | "neutral";

function MiniTable({
  title,
  columns,
  rows,
  keyIndex,
  highlightKey,
  rowRoles,
  rowRefs,
  nullPadLabel,
}: {
  title: string;
  columns: string[];
  rows: (string | number | null | Uint8Array)[][];
  keyIndex: number;
  highlightKey: boolean;
  rowRoles: Map<number, RowRole>;
  rowRefs?: (el: HTMLDivElement | null, index: number) => void;
  /** When set, show a dashed "NULL" pad under unmatched-keep rows (LEFT JOIN). */
  nullPadLabel?: string | null;
}) {
  const grid = `repeat(${columns.length}, minmax(3.5rem, 1fr))`;
  return (
    <div className="space-y-1">
      <div className="mb-1 font-mono text-xs font-semibold text-foreground">
        {title}
      </div>
      <div
        className="grid gap-1 text-[11px] font-medium text-muted-foreground"
        style={{ gridTemplateColumns: grid }}
      >
        {columns.map((c, ci) => (
          <div
            key={c}
            className="truncate rounded px-1.5 py-1 font-mono"
            style={
              highlightKey && ci === keyIndex
                ? {
                    color: clauseVar("JOIN"),
                    backgroundColor:
                      "color-mix(in oklab, var(--clause-join) 18%, transparent)",
                  }
                : undefined
            }
          >
            {c}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {rows.map((row, ri) => {
          const role = rowRoles.get(ri) ?? "neutral";
          const dim = role === "unmatched-drop";
          const keep = role === "unmatched-keep";
          const matched = role === "matched";
          return (
            <div key={ri} className="space-y-0.5">
              <motion.div
                ref={rowRefs ? (el) => rowRefs(el, ri) : undefined}
                animate={{ opacity: dim ? 0.28 : 1 }}
                className={cn(
                  "grid items-center gap-1 rounded-md border px-0.5 text-[12px]",
                  keep && "border-dashed",
                )}
                style={{
                  gridTemplateColumns: grid,
                  borderColor:
                    matched || keep ? clauseVar("JOIN") : undefined,
                  backgroundColor: matched
                    ? "color-mix(in oklab, var(--clause-join) 10%, transparent)"
                    : keep
                      ? "color-mix(in oklab, var(--clause-join) 6%, transparent)"
                      : "color-mix(in oklab, var(--card) 60%, transparent)",
                }}
              >
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className="truncate px-1.5 py-1.5 font-mono"
                    style={
                      highlightKey && ci === keyIndex
                        ? { color: clauseVar("JOIN"), fontWeight: 600 }
                        : undefined
                    }
                  >
                    {formatValue(cell)}
                  </div>
                ))}
              </motion.div>
              {keep && nullPadLabel && (
                <div
                  className="rounded border border-dashed px-2 py-1 font-mono text-[10px] italic"
                  style={{
                    borderColor: clauseVar("JOIN"),
                    color: clauseVar("JOIN"),
                    opacity: 0.85,
                  }}
                >
                  {nullPadLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function JoinVisualizer({
  data,
  activeClause,
  step = 0,
}: {
  data: JoinVizData;
  activeClause: SqlClause;
  step?: number;
}) {
  // Multi-join: later JOIN frames (step > 2 typically) show chain[i]
  const joinFrameIndexes = data.frames
    .map((f, i) => (f.clause === "JOIN" ? i : -1))
    .filter((i) => i >= 0);
  const joinOrdinal = Math.max(0, joinFrameIndexes.indexOf(step));
  const chainStep =
    joinOrdinal > 0 && data.chain[joinOrdinal - 1]
      ? data.chain[joinOrdinal - 1]
      : null;
  const view = chainStep
    ? {
        joinKind: chainStep.joinKind,
        left: chainStep.left,
        right: chainStep.right,
        matches: chainStep.matches,
      }
    : {
        joinKind: data.joinKind,
        left: data.left,
        right: data.right,
        matches: data.matches,
      };

  const isOn = activeClause === "ON";
  const isJoin = activeClause === "JOIN";
  const isResult = activeClause === "SELECT";
  const highlightKey = isOn || isJoin;
  const isLeft = view.joinKind === "LEFT";

  const leftMatched = React.useMemo(
    () => new Set(view.matches.map((m) => m.leftIndex)),
    [view.matches],
  );
  const rightMatched = React.useMemo(
    () => new Set(view.matches.map((m) => m.rightIndex)),
    [view.matches],
  );

  const leftRoles = React.useMemo(() => {
    const map = new Map<number, RowRole>();
    if (!isJoin) {
      view.left.rows.forEach((_, i) => map.set(i, "neutral"));
      return map;
    }
    view.left.rows.forEach((_, i) => {
      if (leftMatched.has(i)) map.set(i, "matched");
      else if (isLeft) map.set(i, "unmatched-keep");
      else map.set(i, "unmatched-drop");
    });
    return map;
  }, [isJoin, isLeft, view.left.rows, leftMatched]);

  const rightRoles = React.useMemo(() => {
    const map = new Map<number, RowRole>();
    if (!isJoin) {
      view.right.rows.forEach((_, i) => map.set(i, "neutral"));
      return map;
    }
    view.right.rows.forEach((_, i) => {
      if (rightMatched.has(i)) map.set(i, "matched");
      else map.set(i, "unmatched-drop");
    });
    return map;
  }, [isJoin, view.right.rows, rightMatched]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const leftEls = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const rightEls = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const [lines, setLines] = React.useState<Line[]>([]);

  const measure = React.useCallback(() => {
    if (!isJoin || !containerRef.current) {
      setLines([]);
      return;
    }
    const base = containerRef.current.getBoundingClientRect();
    const next: Line[] = [];
    for (const m of view.matches) {
      const l = leftEls.current.get(m.leftIndex);
      const r = rightEls.current.get(m.rightIndex);
      if (!l || !r) continue;
      const lr = l.getBoundingClientRect();
      const rr = r.getBoundingClientRect();
      next.push({
        x1: lr.right - base.left,
        y1: lr.top + lr.height / 2 - base.top,
        x2: rr.left - base.left,
        y2: rr.top + rr.height / 2 - base.top,
        key: `${m.leftIndex}-${m.rightIndex}`,
      });
    }
    setLines(next);
  }, [isJoin, view.matches]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  if (isResult) {
    const grid = `repeat(${data.result.columns.length}, minmax(4rem, 1fr))`;
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: clauseVar("SELECT") }}>
          Bảng kết quả sau khi ghép ({data.result.rows.length} dòng)
          {isLeft && " · LEFT JOIN giữ dòng trái không khớp với NULL"}
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-fit space-y-1">
            <div
              className="grid gap-1 text-[11px] font-medium text-muted-foreground"
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.05 }}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      {isJoin && isLeft && (
        <p className="text-[11px] text-muted-foreground">
          Viền nét đứt + nhãn NULL: dòng bảng trái không khớp vẫn được giữ.
        </p>
      )}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
        <AnimatePresence>
          {lines.map((line) => (
            <motion.line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={clauseVar("JOIN")}
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </AnimatePresence>
      </svg>

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <MiniTable
          title={view.left.table}
          columns={view.left.columns}
          rows={view.left.rows}
          keyIndex={view.left.keyIndex}
          highlightKey={highlightKey}
          rowRoles={leftRoles}
          nullPadLabel={
            isJoin && isLeft
              ? `+ cột ${view.right.table}.* → NULL`
              : null
          }
          rowRefs={(el, i) => {
            if (el) leftEls.current.set(i, el);
            else leftEls.current.delete(i);
          }}
        />
        <div
          className="self-center px-1 text-center font-mono text-xs font-semibold"
          style={{ color: clauseVar("JOIN") }}
        >
          {view.joinKind}
          <br />
          JOIN
        </div>
        <MiniTable
          title={view.right.table}
          columns={view.right.columns}
          rows={view.right.rows}
          keyIndex={view.right.keyIndex}
          highlightKey={highlightKey}
          rowRoles={rightRoles}
          rowRefs={(el, i) => {
            if (el) rightEls.current.set(i, el);
            else rightEls.current.delete(i);
          }}
        />
      </div>
    </div>
  );
}
