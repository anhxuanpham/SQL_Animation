"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Database,
  LockKeyhole,
  MousePointer2,
  Rows3,
  Terminal,
  Unlock,
} from "lucide-react";

import type { SqlDatabase } from "@/lib/db/sql-engine";
import type {
  LessonStep,
  OracleCursorVariant,
  SqlClause,
} from "@/lib/lessons/types";
import type { Frame } from "@/lib/visualizer/plan";
import { useStepPlayer } from "@/hooks/use-step-player";
import { StepController } from "./step-controller";
import { QueryClauseView } from "./query-clause-view";
import { ClauseChip } from "./shared";
import { cn } from "@/lib/utils";

interface CursorRow {
  id: number;
  label: string;
  group: string;
  value: number | string;
}

interface CursorModel {
  department: string;
  city: string;
  threshold: number;
  amount: number;
  employeeRows: CursorRow[];
  orderRows: CursorRow[];
  userRows: CursorRow[];
}

function namedString(query: string, name: string, fallback: string): string {
  const match = new RegExp(`\\b${name}\\s*=>\\s*'([^']+)'`, "i").exec(query);
  return match?.[1] ?? fallback;
}

function namedNumber(query: string, name: string, fallback: number): number {
  const match = new RegExp(
    `\\b${name}\\s*=>\\s*(-?\\d+(?:\\.\\d+)?)`,
    "i",
  ).exec(query);
  const parsed = Number(match?.[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildModel(db: SqlDatabase, query: string): CursorModel {
  const department = namedString(query, "p_department", "Engineering");
  const city = namedString(query, "p_city", "Hanoi");
  const threshold = namedNumber(query, "p_threshold", 50);
  const amount = namedNumber(query, "p_amount", 100);

  const execRows = (
    sql: string,
    map: (row: (string | number | Uint8Array | null)[]) => CursorRow,
  ): CursorRow[] => {
    try {
      return db.exec(sql).rows.map(map);
    } catch {
      return [];
    }
  };

  const escapedDepartment = department.replace(/'/g, "''");
  const escapedCity = city.replace(/'/g, "''");

  return {
    department,
    city,
    threshold,
    amount,
    employeeRows: execRows(
      `SELECT id, name, department, salary
       FROM employees
       WHERE department = '${escapedDepartment}'
       ORDER BY id`,
      (row) => ({
        id: Number(row[0]),
        label: String(row[1]),
        group: String(row[2]),
        value: Number(row[3]),
      }),
    ),
    orderRows: execRows(
      `SELECT id, product, total
       FROM orders
       WHERE total < ${threshold}
       ORDER BY id`,
      (row) => ({
        id: Number(row[0]),
        label: String(row[1]),
        group: `total < ${threshold}`,
        value: Number(row[2]),
      }),
    ),
    userRows: execRows(
      `SELECT id, name, city, age
       FROM users
       WHERE city = '${escapedCity}'
       ORDER BY id`,
      (row) => ({
        id: Number(row[0]),
        label: String(row[1]),
        group: String(row[2]),
        value: Number(row[3]),
      }),
    ),
  };
}

function CursorRows({
  rows,
  activeIndex = -1,
  mode = "open",
  amount = 0,
}: {
  rows: CursorRow[];
  activeIndex?: number;
  mode?: "open" | "fetch" | "loop" | "locked" | "updated" | "closed";
  amount?: number;
}) {
  if (mode === "closed") {
    return (
      <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
        <Unlock className="size-6" />
        Cursor đã đóng; result set và row locks được giải phóng.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[2rem_1.3fr_1fr_0.8fr] gap-2 px-3 text-[11px] font-medium text-muted-foreground">
        <span>#</span>
        <span>row</span>
        <span>group</span>
        <span>value</span>
      </div>
      {rows.map((row, index) => {
        const active =
          mode === "loop" ||
          mode === "locked" ||
          mode === "updated" ||
          index === activeIndex;
        return (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: active ? 1 : 0.5, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "grid grid-cols-[2rem_1.3fr_1fr_0.8fr] items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs",
              active && "border-primary/45 bg-primary/5",
            )}
          >
            <span className="text-muted-foreground">{row.id}</span>
            <span className="flex items-center gap-1.5">
              {index === activeIndex && (
                <MousePointer2 className="size-3.5 text-primary" />
              )}
              {row.label}
            </span>
            <span className="truncate text-muted-foreground">{row.group}</span>
            <span className="flex items-center gap-1.5 font-semibold">
              {mode === "locked" && <LockKeyhole className="size-3 text-warning" />}
              {row.value}
              {mode === "updated" && typeof row.value === "number" && (
                <span className="text-success">→ {row.value + amount}</span>
              )}
            </span>
          </motion.div>
        );
      })}
      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          Result set rỗng.
        </div>
      )}
    </div>
  );
}

function CursorDefinition({
  label,
  sql,
  rowCount,
}: {
  label: string;
  sql: string;
  rowCount: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
      <div className="rounded-lg border bg-card/70 p-4">
        <p className="mb-2 font-mono text-xs font-semibold text-clause-limit">
          CURSOR {label} IS
        </p>
        <code className="font-mono text-xs text-muted-foreground">{sql}</code>
      </div>
      <div className="flex flex-col justify-center rounded-lg border border-clause-limit/35 bg-clause-limit/5 p-4">
        <Rows3 className="size-5 text-clause-limit" />
        <p className="mt-2 text-2xl font-bold">{rowCount}</p>
        <p className="text-xs text-muted-foreground">
          dòng sẽ xuất hiện khi cursor được OPEN
        </p>
      </div>
    </div>
  );
}

function ImplicitAttributes({
  rows,
}: {
  rows: CursorRow[];
}) {
  const attributes = [
    ["SQL%ROWCOUNT", rows.length],
    ["SQL%FOUND", rows.length > 0 ? "TRUE" : "FALSE"],
    ["SQL%NOTFOUND", rows.length === 0 ? "TRUE" : "FALSE"],
    ["SQL%ISOPEN", "FALSE"],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {attributes.map(([label, value]) => (
        <div
          key={String(label)}
          className="rounded-lg border border-clause-groupby/35 bg-clause-groupby/5 p-3"
        >
          <p className="font-mono text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-xl font-bold text-clause-groupby">
            {String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RefCursorHandle({
  city,
  rows,
  clause,
}: {
  city: string;
  rows: CursorRow[];
  clause: SqlClause;
}) {
  if (clause === "OUT") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-clause-groupby/35 bg-clause-groupby/5 p-4">
          <Database className="size-5 text-clause-groupby" />
          <p className="mt-2 font-mono text-sm">p_result SYS_REFCURSOR</p>
          <p className="mt-1 text-xs text-muted-foreground">
            OUT trả một handle, không copy toàn bộ result set.
          </p>
        </div>
        <div className="rounded-lg border bg-slate-950 p-4 text-slate-100">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Terminal className="size-4" /> consumer
          </p>
          <p className="mt-3 font-mono text-sm text-emerald-400">
            cursor handle → {rows.length} rows for {city}
          </p>
        </div>
      </div>
    );
  }
  return (
    <CursorRows
      rows={rows}
      activeIndex={clause === "FETCH" ? 0 : -1}
      mode={
        clause === "CLOSE"
          ? "closed"
          : clause === "FETCH"
            ? "fetch"
            : "open"
      }
    />
  );
}

function defaultFrames(variant: OracleCursorVariant): Frame[] {
  if (variant === "implicit") {
    return [
      {
        clause: "DELETE",
        title: "Oracle tạo implicit cursor",
        description: "Mỗi DML tự tạo cursor SQL mà ta không cần OPEN/CLOSE.",
      },
      {
        clause: "OUT",
        title: "Đọc SQL cursor attributes",
        description: "ROWCOUNT, FOUND và NOTFOUND mô tả DML gần nhất.",
      },
    ];
  }
  if (variant === "explicit") {
    return [
      { clause: "CURSOR", title: "Khai báo cursor", description: "Định nghĩa query." },
      { clause: "OPEN", title: "OPEN", description: "Chạy query và tạo active set." },
      { clause: "FETCH", title: "FETCH", description: "Đọc một dòng vào biến." },
      { clause: "LOOP", title: "Lặp", description: "Tiếp tục tới %NOTFOUND." },
      { clause: "CLOSE", title: "CLOSE", description: "Giải phóng cursor." },
    ];
  }
  if (variant === "for-loop") {
    return [
      { clause: "CURSOR", title: "Parameterized cursor", description: "Query nhận tham số." },
      { clause: "OPEN", title: "FOR loop tự OPEN", description: "Oracle quản lý lifecycle." },
      { clause: "LOOP", title: "Record loop", description: "Mỗi vòng có một record." },
      { clause: "CLOSE", title: "Tự CLOSE", description: "Không cần lệnh CLOSE thủ công." },
    ];
  }
  if (variant === "for-update") {
    return [
      { clause: "CURSOR", title: "Cursor cập nhật", description: "Định nghĩa tập dòng." },
      { clause: "FOR UPDATE", title: "Khóa dòng", description: "Oracle giữ row locks." },
      { clause: "FETCH", title: "FETCH current row", description: "Con trỏ đứng trên một dòng." },
      { clause: "CURRENT OF", title: "UPDATE current row", description: "Không lặp lại WHERE." },
      { clause: "COMMIT", title: "COMMIT", description: "Lưu và nhả locks." },
    ];
  }
  return [
    { clause: "PROCEDURE", title: "Khai báo SYS_REFCURSOR OUT", description: "API trả handle." },
    { clause: "OPEN", title: "OPEN FOR query", description: "Gắn query runtime vào handle." },
    { clause: "OUT", title: "Trả handle", description: "Caller nhận result set." },
    { clause: "FETCH", title: "Caller FETCH", description: "Consumer đọc các dòng." },
    { clause: "CLOSE", title: "Caller CLOSE", description: "Consumer giải phóng handle." },
  ];
}

export function CursorVisualizer({
  db,
  query,
  variant = "implicit",
  authoredSteps,
}: {
  db: SqlDatabase;
  query: string;
  variant?: OracleCursorVariant;
  authoredSteps?: LessonStep[];
}) {
  const model = React.useMemo(() => buildModel(db, query), [db, query]);
  const frames = React.useMemo<Frame[]>(
    () =>
      authoredSteps?.length
        ? authoredSteps.map((step) => ({
            clause: step.clause ?? "CURSOR",
            title: step.title,
            description: step.description,
          }))
        : defaultFrames(variant),
    [authoredSteps, variant],
  );
  const player = useStepPlayer(frames.length);
  const current = Math.min(player.current, frames.length - 1);
  const frame = frames[current];

  let stage: React.ReactNode;
  if (variant === "implicit") {
    stage =
      frame.clause === "OUT" ? (
        <ImplicitAttributes rows={model.orderRows} />
      ) : (
        <CursorRows rows={model.orderRows} mode="loop" />
      );
  } else if (variant === "explicit" || variant === "for-loop") {
    if (frame.clause === "CURSOR") {
      stage = (
        <CursorDefinition
          label={variant === "explicit" ? "c_employees" : "c_department"}
          sql={`SELECT ... FROM employees WHERE department = '${model.department}'`}
          rowCount={model.employeeRows.length}
        />
      );
    } else {
      stage = (
        <CursorRows
          rows={model.employeeRows}
          activeIndex={frame.clause === "FETCH" ? 0 : -1}
          mode={
            frame.clause === "CLOSE"
              ? "closed"
              : frame.clause === "LOOP"
                ? "loop"
                : frame.clause === "FETCH"
                  ? "fetch"
                  : "open"
          }
        />
      );
    }
  } else if (variant === "for-update") {
    if (frame.clause === "CURSOR") {
      stage = (
        <CursorDefinition
          label="c_sales"
          sql={`SELECT ... FROM employees WHERE department = '${model.department}' FOR UPDATE`}
          rowCount={model.employeeRows.length}
        />
      );
    } else {
      stage = (
        <CursorRows
          rows={model.employeeRows}
          activeIndex={frame.clause === "FETCH" ? 0 : -1}
          amount={model.amount}
          mode={
            frame.clause === "COMMIT"
              ? "closed"
              : frame.clause === "CURRENT OF" || frame.clause === "UPDATE"
                ? "updated"
                : frame.clause === "FOR UPDATE"
                  ? "locked"
                  : "fetch"
          }
        />
      );
    }
  } else {
    stage =
      frame.clause === "PROCEDURE" ? (
        <CursorDefinition
          label="p_result SYS_REFCURSOR"
          sql={`OPEN p_result FOR SELECT ... FROM users WHERE city = '${model.city}'`}
          rowCount={model.userRows.length}
        />
      ) : (
        <RefCursorHandle
          city={model.city}
          rows={model.userRows}
          clause={frame.clause}
        />
      );
  }

  return (
    <div className="space-y-4">
      <QueryClauseView query={query} activeClause={frame.clause} />
      <StepController player={player} frames={frames} />
      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
        <ClauseChip clause={frame.clause} active />
        <div>
          <p className="text-sm font-semibold">{frame.title}</p>
          <p className="text-sm text-muted-foreground">{frame.description}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card/30 p-3 sm:p-4">{stage}</div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-success" />
        Dữ liệu minh họa lấy từ database mẫu; lifecycle tuân theo semantics
        Oracle PL/SQL.
      </p>
    </div>
  );
}
