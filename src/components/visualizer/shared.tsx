"use client";

import * as React from "react";

import { CLAUSE_META, type SqlClause } from "@/lib/lessons/types";
import type { SqlValue } from "@/lib/db/sql-engine";
import { cn } from "@/lib/utils";

/** Display formatting for a SQL cell value. */
export function formatValue(v: SqlValue): string {
  if (v === null) return "NULL";
  if (v instanceof Uint8Array) return `blob(${v.length})`;
  return String(v);
}

/** Runtime CSS variable for a clause color (defined in globals.css :root/.dark). */
export function clauseVar(clause: SqlClause): string {
  return `var(--${CLAUSE_META[clause].token})`;
}

/** Soft translucent background of a clause color. */
export function clauseSoftBg(clause: SqlClause, pct = 15): string {
  return `color-mix(in oklab, ${clauseVar(clause)} ${pct}%, transparent)`;
}

interface ClauseChipProps {
  clause: SqlClause;
  active?: boolean;
  className?: string;
}

/** A colored pill showing a clause keyword; emphasized when active. */
export function ClauseChip({ clause, active = false, className }: ClauseChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-all",
        active ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-70",
        className,
      )}
      style={{
        color: clauseVar(clause),
        backgroundColor: clauseSoftBg(clause, active ? 22 : 12),
        // @ts-expect-error CSS custom property for ring color
        "--tw-ring-color": clauseVar(clause),
      }}
    >
      {clause}
    </span>
  );
}

/** A small legend explaining the active clause meaning. */
export function ClauseLegend({ clause }: { clause: SqlClause }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <ClauseChip clause={clause} active />
      <span className="text-muted-foreground">{CLAUSE_META[clause].label}</span>
    </div>
  );
}
