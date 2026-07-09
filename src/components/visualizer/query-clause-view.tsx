"use client";

import * as React from "react";

import type { SqlClause } from "@/lib/lessons/types";
import { clauseVar, clauseSoftBg } from "./shared";

/**
 * Renders a SQL string with clause keywords colored, highlighting the clause
 * that is currently being explained by the animation.
 */

interface KeywordMap {
  kw: string;
  clause: SqlClause;
}

// Longest / multi-word keywords first so they win in the alternation.
const KEYWORDS: KeywordMap[] = [
  { kw: "GROUP BY", clause: "GROUP BY" },
  { kw: "ORDER BY", clause: "ORDER BY" },
  { kw: "INNER JOIN", clause: "JOIN" },
  { kw: "LEFT JOIN", clause: "JOIN" },
  { kw: "RIGHT JOIN", clause: "JOIN" },
  { kw: "FULL JOIN", clause: "JOIN" },
  { kw: "CROSS JOIN", clause: "JOIN" },
  { kw: "INSERT INTO", clause: "INSERT" },
  { kw: "DELETE FROM", clause: "DELETE" },
  { kw: "SELECT", clause: "SELECT" },
  { kw: "FROM", clause: "FROM" },
  { kw: "WHERE", clause: "WHERE" },
  { kw: "HAVING", clause: "HAVING" },
  { kw: "LIMIT", clause: "LIMIT" },
  { kw: "JOIN", clause: "JOIN" },
  { kw: "ON", clause: "ON" },
  { kw: "VALUES", clause: "VALUES" },
  { kw: "UPDATE", clause: "UPDATE" },
  { kw: "SET", clause: "SET" },
  { kw: "DELETE", clause: "DELETE" },
  { kw: "BEGIN", clause: "BEGIN" },
  { kw: "COMMIT", clause: "COMMIT" },
  { kw: "ROLLBACK", clause: "ROLLBACK" },
  { kw: "CREATE", clause: "CREATE" },
  { kw: "OVER", clause: "OVER" },
  { kw: "WITH", clause: "WITH" },
];

const KW_LOOKUP = new Map(KEYWORDS.map((k) => [k.kw.toUpperCase(), k.clause]));

const SPLIT_RE = new RegExp(
  `\\b(${KEYWORDS.map((k) => k.kw.replace(/ /g, "\\s+")).join("|")})\\b`,
  "gi",
);

export function QueryClauseView({
  query,
  activeClause,
}: {
  query: string;
  activeClause?: SqlClause;
}) {
  const tokens = React.useMemo(() => {
    const parts = query.split(SPLIT_RE);
    return parts.map((part, i) => {
      const normalized = part.replace(/\s+/g, " ").trim().toUpperCase();
      const clause = KW_LOOKUP.get(normalized);
      return { part, clause, key: i };
    });
  }, [query]);

  return (
    <pre className="overflow-x-auto rounded-lg border bg-card/60 p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
      {tokens.map(({ part, clause, key }) => {
        if (!clause) {
          return <span key={key}>{part}</span>;
        }
        const isActive = clause === activeClause;
        return (
          <span
            key={key}
            className="rounded px-1 font-semibold transition-all"
            style={{
              color: clauseVar(clause),
              backgroundColor: isActive ? clauseSoftBg(clause, 30) : "transparent",
              boxShadow: isActive
                ? `inset 0 0 0 1.5px ${clauseVar(clause)}`
                : "none",
            }}
          >
            {part}
          </span>
        );
      })}
    </pre>
  );
}
