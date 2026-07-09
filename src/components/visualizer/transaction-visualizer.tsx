"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Play, Check, Undo2 } from "lucide-react";

import type { SqlDatabase, SqlValue } from "@/lib/db/sql-engine";
import { analyzeQuery } from "@/lib/visualizer/analyze";
import { useStepPlayer } from "@/hooks/use-step-player";
import { StepController } from "./step-controller";
import { formatValue } from "./shared";
import { cn } from "@/lib/utils";

interface TxRow {
  id: number;
  cells: SqlValue[];
}

export function TransactionVisualizer({
  db,
  query,
}: {
  db: SqlDatabase;
  query: string;
}) {
  const player = useStepPlayer(3);
  const { current } = player;

  const model = React.useMemo(() => {
    const commit = /\bcommit\b/i.test(query);
    const inner = query
      .replace(/^\s*begin\s*(transaction)?\s*;?/i, "")
      .replace(/\b(commit|rollback)\b\s*;?\s*$/i, "")
      .trim();
    const a = analyzeQuery(inner);
    if (a.kind !== "update" && a.kind !== "delete" && a.kind !== "insert") {
      return null;
    }
    const table = a.table;
    try {
      const beforeRes = db.exec(`SELECT * FROM ${table}`);
      const columns = beforeRes.columns;
      const before: TxRow[] = beforeRes.rows.map((cells, i) => ({
        id: typeof cells[0] === "number" ? cells[0] : i,
        cells,
      }));

      db.exec("SAVEPOINT __tx");
      let after: TxRow[] = [];
      try {
        db.exec(inner);
        const afterRes = db.exec(`SELECT * FROM ${table}`);
        after = afterRes.rows.map((cells, i) => ({
          id: typeof cells[0] === "number" ? cells[0] : i,
          cells,
        }));
      } finally {
        db.exec("ROLLBACK TO __tx");
        db.exec("RELEASE __tx");
      }

      const beforeById = new Map(before.map((r) => [r.id, r]));
      const changed: Record<number, number[]> = {};
      const changedIds = new Set<number>();
      for (const r of after) {
        const prev = beforeById.get(r.id);
        if (!prev) {
          changedIds.add(r.id);
          continue;
        }
        const diffs: number[] = [];
        r.cells.forEach((c, i) => {
          if (String(c) !== String(prev.cells[i])) diffs.push(i);
        });
        if (diffs.length) {
          changed[r.id] = diffs;
          changedIds.add(r.id);
        }
      }
      return { commit, table, columns, before, after, changed, changedIds };
    } catch {
      return null;
    }
  }, [db, query]);

  const frames = React.useMemo(() => {
    const commit = model?.commit ?? false;
    return [
      { title: "BEGIN", description: "Mở transaction — các thay đổi sẽ ở trạng thái tạm." },
      {
        title: "Thay đổi tạm thời",
        description: "Dữ liệu được sửa nhưng chưa lưu vĩnh viễn.",
      },
      commit
        ? { title: "COMMIT", description: "Các thay đổi được lưu vĩnh viễn." }
        : { title: "ROLLBACK", description: "Mọi thay đổi bị hủy; dữ liệu trở về ban đầu." },
    ];
  }, [model]);

  if (!model) {
    return (
      <p className="text-sm text-muted-foreground">
        Không phân tích được transaction cho minh họa.
      </p>
    );
  }

  const { commit, columns, before, after, changed, changedIds } = model;
  const showAfter = current === 1 || (current === 2 && commit);
  const rows = showAfter ? after : before;
  const grid = `2rem repeat(${columns.length}, minmax(4rem, 1fr))`;

  const badge =
    current === 0
      ? { label: "Transaction bắt đầu", color: "var(--clause-join)", Icon: Play }
      : current === 1
        ? { label: "Chưa lưu (pending)", color: "var(--warning)", Icon: Play }
        : commit
          ? { label: "Đã COMMIT", color: "var(--success)", Icon: Check }
          : { label: "Đã ROLLBACK", color: "var(--clause-orderby)", Icon: Undo2 };

  return (
    <div className="space-y-4">
      <StepController player={player} />

      <div className="rounded-lg border bg-muted/20 p-3">
        <div
          className="mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
          style={{
            color: badge.color,
            backgroundColor: `color-mix(in oklab, ${badge.color} 15%, transparent)`,
          }}
        >
          <badge.Icon className="size-3.5" />
          {badge.label}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-fit space-y-1">
            <div
              className="grid gap-1 text-[11px] font-medium text-muted-foreground"
              style={{ gridTemplateColumns: grid }}
            >
              <div className="px-2 py-1" />
              {columns.map((c) => (
                <div key={c} className="truncate px-2 py-1 font-mono">
                  {c}
                </div>
              ))}
            </div>

            {rows.map((row) => {
              const isChanged = changedIds.has(row.id);
              const changedCells = changed[row.id] ?? [];
              const tint =
                isChanged && current === 1
                  ? "var(--warning)"
                  : isChanged && current === 2 && commit
                    ? "var(--success)"
                    : undefined;
              return (
                <motion.div
                  key={row.id}
                  layout
                  className={cn(
                    "grid items-center gap-1 rounded-md border text-[12px]",
                    isChanged && current === 1 && "border-dashed",
                  )}
                  style={{
                    gridTemplateColumns: grid,
                    borderColor: tint ?? "var(--border)",
                    backgroundColor: tint
                      ? `color-mix(in oklab, ${tint} 12%, transparent)`
                      : "color-mix(in oklab, var(--card) 60%, transparent)",
                  }}
                >
                  <div className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                    {row.id}
                  </div>
                  {row.cells.map((cell, ci) => (
                    <div
                      key={ci}
                      className={cn(
                        "truncate px-2 py-1.5 font-mono",
                        changedCells.includes(ci) && tint && "font-semibold",
                      )}
                    >
                      {formatValue(cell)}
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{frames[current].description}</p>
    </div>
  );
}
