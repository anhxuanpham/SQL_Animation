"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { clauseVar } from "@/components/visualizer/shared";
import type { SqlClause } from "@/lib/lessons/types";

interface DemoRow {
  id: number;
  name: string;
  age: number;
}

const ROWS: DemoRow[] = [
  { id: 1, name: "An", age: 28 },
  { id: 2, name: "Binh", age: 17 },
  { id: 3, name: "Chi", age: 34 },
  { id: 4, name: "Nam", age: 19 },
];

const STAGES: { clause: SqlClause; label: string }[] = [
  { clause: "FROM", label: "FROM users" },
  { clause: "WHERE", label: "WHERE age >= 18" },
  { clause: "SELECT", label: "SELECT name, age" },
  { clause: "ORDER BY", label: "ORDER BY age DESC" },
];

export function HeroDemo() {
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1900);
    return () => clearInterval(t);
  }, []);

  const filtering = stage >= 1;
  const projecting = stage >= 2;
  const ordering = stage >= 3;

  let rows = ROWS.filter((r) => (filtering ? r.age >= 18 : true));
  if (ordering) rows = [...rows].sort((a, b) => b.age - a.age);
  const displayRows = stage === 1 ? ROWS : rows; // stage 1 shows all, marks failing

  const color = clauseVar(STAGES[stage].clause);

  return (
    <div className="w-full rounded-2xl border bg-card/70 p-4 shadow-xl backdrop-blur">
      {/* clause pipeline */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STAGES.map((s, i) => (
          <span
            key={s.clause}
            className="rounded-md px-2 py-1 font-mono text-xs font-semibold transition-all"
            style={{
              color: clauseVar(s.clause),
              backgroundColor:
                i === stage
                  ? `color-mix(in oklab, ${clauseVar(s.clause)} 22%, transparent)`
                  : "transparent",
              opacity: i === stage ? 1 : 0.45,
              boxShadow: i === stage ? `inset 0 0 0 1.5px ${clauseVar(s.clause)}` : "none",
            }}
          >
            {s.clause}
          </span>
        ))}
      </div>

      <div
        className="mb-3 rounded-md px-2 py-1 font-mono text-xs"
        style={{ color, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)` }}
      >
        {STAGES[stage].label}
      </div>

      {/* mini table */}
      <div className="space-y-1">
        <div className="grid grid-cols-[2rem_1fr_3rem] gap-1 px-1 font-mono text-[11px] text-muted-foreground">
          <motion.span animate={{ opacity: projecting ? 0.3 : 1 }}>id</motion.span>
          <span>name</span>
          <span>age</span>
        </div>
        <AnimatePresence mode="popLayout">
          {displayRows.map((row) => {
            const failing = stage === 1 && row.age < 18;
            return (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: failing ? 0.35 : 1, y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="grid grid-cols-[2rem_1fr_3rem] items-center gap-1 rounded-md border px-1 py-1.5 font-mono text-xs"
                style={{
                  borderColor: failing ? "var(--destructive)" : "var(--border)",
                  backgroundColor: failing
                    ? "color-mix(in oklab, var(--destructive) 10%, transparent)"
                    : "color-mix(in oklab, var(--card) 60%, transparent)",
                }}
              >
                <motion.span
                  animate={{ opacity: projecting ? 0.25 : 1 }}
                  className="text-muted-foreground"
                >
                  {row.id}
                </motion.span>
                <span>{row.name}</span>
                <span
                  style={
                    ordering ? { color: clauseVar("ORDER BY"), fontWeight: 700 } : undefined
                  }
                >
                  {row.age}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
