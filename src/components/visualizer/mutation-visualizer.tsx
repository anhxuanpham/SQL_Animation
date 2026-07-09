"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Plus } from "lucide-react";

import type { MutationVizData } from "@/lib/visualizer/plan";
import type { SqlValue } from "@/lib/db/sql-engine";
import { cn } from "@/lib/utils";
import { formatValue } from "./shared";

export function MutationVisualizer({
  data,
  step,
}: {
  data: MutationVizData;
  step: number;
}) {
  const { operation } = data;
  const isFinal = step >= 2;

  const addedSet = React.useMemo(() => new Set(data.addedIds), [data.addedIds]);
  const deletedSet = React.useMemo(
    () => new Set(data.deletedIds),
    [data.deletedIds],
  );
  const updatedSet = React.useMemo(
    () => new Set(data.updatedIds),
    [data.updatedIds],
  );

  // Which row set to render at this stage.
  const rows = isFinal ? data.afterRows : data.beforeRows;
  const grid = `2rem repeat(${data.columns.length}, minmax(4rem, 1fr))`;

  const addedRows = data.afterRows.filter((r) => addedSet.has(r.id));

  const rowStyle = (id: number): { bg: string; border?: string } => {
    if (operation === "insert" && addedSet.has(id) && isFinal) {
      return {
        bg: "color-mix(in oklab, var(--success) 15%, transparent)",
        border: "var(--success)",
      };
    }
    if (operation === "delete" && deletedSet.has(id)) {
      if (step === 0)
        return { bg: "color-mix(in oklab, var(--warning) 12%, transparent)" };
      return {
        bg: "color-mix(in oklab, var(--destructive) 15%, transparent)",
        border: "var(--destructive)",
      };
    }
    if (operation === "update" && updatedSet.has(id)) {
      return {
        bg: "color-mix(in oklab, var(--clause-where) 14%, transparent)",
        border: "var(--clause-where)",
      };
    }
    return { bg: "color-mix(in oklab, var(--card) 60%, transparent)" };
  };

  return (
    <div className="space-y-3">
      {/* Floating card for INSERT values stage */}
      <AnimatePresence>
        {operation === "insert" && step === 1 && addedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="mx-auto w-fit rounded-lg border-2 border-dashed p-2.5"
            style={{ borderColor: "var(--success)" }}
          >
            <div className="mb-1 flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
              <Plus className="size-3" /> Dòng mới
            </div>
            {addedRows.map((r) => (
              <div key={r.id} className="flex flex-wrap gap-1.5">
                {r.cells.map((c, ci) => (
                  <span key={ci} className="font-mono text-[11px]">
                    <span className="text-muted-foreground">{data.columns[ci]}=</span>
                    {formatValue(c)}
                  </span>
                ))}
              </div>
            ))}
            <div className="mt-1 flex justify-center text-muted-foreground">
              <ArrowDown className="size-4 animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <div className="min-w-fit space-y-1">
          <div
            className="grid gap-1 text-[11px] font-medium text-muted-foreground"
            style={{ gridTemplateColumns: grid }}
          >
            <div className="px-2 py-1" />
            {data.columns.map((c) => (
              <div key={c} className="truncate px-2 py-1 font-mono">
                {c}
              </div>
            ))}
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            {rows.map((row) => {
              const style = rowStyle(row.id);
              const changedCells = data.changed[row.id] ?? [];
              return (
                <motion.div
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, height: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 30 }}
                  className="grid items-center gap-1 rounded-md border text-[12px]"
                  style={{
                    gridTemplateColumns: grid,
                    backgroundColor: style.bg,
                    borderColor: style.border ?? "var(--border)",
                  }}
                >
                  <div className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {row.id}
                  </div>
                  {row.cells.map((cell, ci) => {
                    const isChanged =
                      operation === "update" && isFinal && changedCells.includes(ci);
                    return (
                      <motion.div
                        key={ci}
                        animate={
                          isChanged
                            ? { scale: [1, 1.15, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "truncate rounded px-2 py-1.5 font-mono",
                          cell === null && "text-muted-foreground/60 italic",
                        )}
                        style={
                          isChanged
                            ? {
                                backgroundColor:
                                  "color-mix(in oklab, var(--success) 25%, transparent)",
                                fontWeight: 600,
                              }
                            : undefined
                        }
                      >
                        {formatValue(cell as SqlValue)}
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
        {operation === "insert" && `Sau khi thêm: ${data.afterRows.length} dòng`}
        {operation === "delete" &&
          (isFinal
            ? `Sau khi xóa: ${data.afterRows.length} dòng (đã xóa ${data.deletedIds.length})`
            : `${data.deletedIds.length} dòng sẽ bị xóa`)}
        {operation === "update" &&
          `${data.updatedIds.length} dòng được cập nhật`}
      </p>
    </div>
  );
}
