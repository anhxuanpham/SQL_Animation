"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Zap, ListTree } from "lucide-react";

import type { SqlDatabase, SqlValue } from "@/lib/db/sql-engine";
import { analyzeQuery } from "@/lib/visualizer/analyze";
import { useStepPlayer } from "@/hooks/use-step-player";
import { StepController } from "./step-controller";
import { formatValue } from "./shared";
import { cn } from "@/lib/utils";

const ROW_H = 34;

interface IndexRow {
  cells: SqlValue[];
  pass: boolean;
}

function compare(a: SqlValue, b: SqlValue): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

const FRAMES = [
  {
    title: "Full table scan",
    description:
      "Không có index: con trỏ đọc lần lượt từng dòng từ trên xuống cho đến khi tìm thấy.",
  },
  {
    title: "Index lookup",
    description:
      "Có index (dữ liệu đã sắp xếp): DBMS nhảy nhanh tới đúng dòng, bỏ qua phần lớn bảng.",
  },
  {
    title: "So sánh",
    description: "Index giảm mạnh số dòng phải quét, đặc biệt với bảng lớn.",
  },
];

export function IndexVisualizer({
  db,
  query,
}: {
  db: SqlDatabase;
  query: string;
}) {
  const player = useStepPlayer(FRAMES.length);
  const { current } = player;

  const model = React.useMemo(() => {
    const a = analyzeQuery(query);
    if (a.kind !== "select" || !a.from) return null;
    const table = a.from.table;
    const where = a.where;
    try {
      const res = where
        ? db.exec(
            `SELECT *, CASE WHEN (${where}) THEN 1 ELSE 0 END AS __pass FROM ${table}`,
          )
        : db.exec(`SELECT * FROM ${table}`);
      const columns = where ? res.columns.slice(0, -1) : res.columns;
      const rows: IndexRow[] = res.rows.map((r) => ({
        cells: where ? r.slice(0, -1) : r,
        pass: where ? Boolean(r[r.length - 1]) : false,
      }));
      const keyMatch = where ? /([a-z_][a-z0-9_]*)\s*(?:=|>|<|>=|<=|like)/i.exec(where) : null;
      const keyCol = keyMatch?.[1] ?? columns[1] ?? columns[0];
      const keyIndex = Math.max(
        0,
        columns.findIndex((c) => c.toLowerCase() === keyCol.toLowerCase()),
      );
      return { table, columns, rows, keyIndex, keyCol };
    } catch {
      return null;
    }
  }, [db, query]);

  if (!model) {
    return (
      <p className="text-sm text-muted-foreground">
        Không phân tích được truy vấn cho minh họa index.
      </p>
    );
  }

  const { columns, rows, keyIndex } = model;
  const targetIndex = rows.findIndex((r) => r.pass);

  // Sorted order for the index view.
  const sorted = rows
    .map((r, i) => ({ r, i }))
    .sort((x, y) => compare(x.r.cells[keyIndex], y.r.cells[keyIndex]));
  const targetSorted = sorted.findIndex((s) => s.i === targetIndex);

  const isScan = current === 0;
  const isIndex = current === 1;
  const isCompare = current === 2;

  const displayRows = isIndex ? sorted.map((s) => s.r) : rows;
  const pointerTarget = isIndex ? targetSorted : targetIndex;

  return (
    <div className="space-y-4">
      <StepController player={player} />

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          {isScan && <Search className="size-3.5 text-clause-where" />}
          {isIndex && <ListTree className="size-3.5 text-clause-join" />}
          {isCompare && <Zap className="size-3.5 text-clause-from" />}
          <span>{FRAMES[current].title}</span>
          {isIndex && (
            <span className="ml-auto rounded bg-clause-join/15 px-1.5 py-0.5 text-[10px] text-clause-join">
              sắp xếp theo {model.keyCol}
            </span>
          )}
        </div>

        {isCompare ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-clause-where/40 bg-clause-where/5 p-3 text-center">
              <div className="text-2xl font-bold text-clause-where">
                {targetIndex >= 0 ? targetIndex + 1 : rows.length}
              </div>
              <div className="text-xs text-muted-foreground">dòng phải đọc (full scan)</div>
            </div>
            <div className="rounded-lg border border-clause-from/40 bg-clause-from/5 p-3 text-center">
              <div className="text-2xl font-bold text-clause-from">
                ~{Math.max(1, Math.ceil(Math.log2(rows.length + 1)))}
              </div>
              <div className="text-xs text-muted-foreground">bước với index (B-Tree)</div>
            </div>
          </div>
        ) : (
          <div
            className="relative"
            style={{ height: displayRows.length * ROW_H }}
          >
            {/* Scanner / pointer bar */}
            {pointerTarget >= 0 && (
              <motion.div
                className="absolute inset-x-0 rounded-md"
                style={{
                  height: ROW_H - 4,
                  backgroundColor: isScan
                    ? "color-mix(in oklab, var(--clause-where) 18%, transparent)"
                    : "color-mix(in oklab, var(--clause-join) 22%, transparent)",
                  border: `1.5px solid ${isScan ? "var(--clause-where)" : "var(--clause-join)"}`,
                }}
                initial={{ y: 0 }}
                animate={{
                  y: isScan
                    ? [0, pointerTarget * ROW_H]
                    : pointerTarget * ROW_H,
                }}
                transition={
                  isScan
                    ? {
                        duration: Math.max(0.8, pointerTarget * 0.22),
                        repeat: Infinity,
                        repeatType: "loop",
                        repeatDelay: 0.7,
                        ease: "linear",
                      }
                    : { type: "spring", stiffness: 200, damping: 20 }
                }
              />
            )}

            {displayRows.map((row, ri) => {
              const isTarget = ri === pointerTarget;
              return (
                <div
                  key={ri}
                  className="absolute inset-x-0 flex items-center gap-2 px-2 font-mono text-xs"
                  style={{ top: ri * ROW_H, height: ROW_H }}
                >
                  <span className="w-5 text-[10px] text-muted-foreground">
                    {ri + 1}
                  </span>
                  {columns.map((c, ci) => (
                    <span
                      key={ci}
                      className={cn(
                        "truncate",
                        ci === keyIndex && "font-semibold",
                        isTarget && ci === keyIndex && "text-clause-from",
                      )}
                      style={{ minWidth: "3.5rem" }}
                    >
                      {formatValue(row.cells[ci])}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{FRAMES[current].description}</p>
    </div>
  );
}
