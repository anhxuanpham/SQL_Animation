"use client";

import * as React from "react";
import { Info, Sparkles, AlertCircle } from "lucide-react";

import type { SqlDatabase } from "@/lib/db/sql-engine";
import type {
  LessonStep,
  OracleCursorVariant,
  OracleProcedureVariant,
  SqlClause,
  VisualizationType,
} from "@/lib/lessons/types";
import { buildVizPlan } from "@/lib/visualizer/plan";
import { useStepPlayer } from "@/hooks/use-step-player";

import { StepController } from "./step-controller";
import { QueryClauseView } from "./query-clause-view";
import { ClauseChip } from "./shared";
import { TableVisualizer } from "./table-visualizer";
import { JoinVisualizer } from "./join-visualizer";
import { GroupByVisualizer } from "./group-by-visualizer";
import { MutationVisualizer } from "./mutation-visualizer";
import { IndexVisualizer } from "./index-visualizer";
import { TransactionVisualizer } from "./transaction-visualizer";
import { CteVisualizer } from "./cte-visualizer";
import { SubqueryVisualizer } from "./subquery-visualizer";
import { WindowVisualizer } from "./window-visualizer";
import { ProcedureVisualizer } from "./procedure-visualizer";
import { CursorVisualizer } from "./cursor-visualizer";
import { ResultTable, type ResultTableError } from "@/components/editor/result-table";
import { CLAUSE_META } from "@/lib/lessons/types";

interface QueryVisualizerProps {
  db: SqlDatabase | null;
  query: string;
  type: VisualizationType;
  oracleVariant?: OracleProcedureVariant;
  oracleCursorVariant?: OracleCursorVariant;
  authoredSteps?: LessonStep[];
  tables: string[];
  /** True when visualizing the lesson's canonical demo query. */
  isCanonical?: boolean;
  /** Playground execution error — shown in the viz panel for fail coupling. */
  execError?: ResultTableError | null;
}

function LoadingStage() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      Đang khởi tạo cơ sở dữ liệu…
    </div>
  );
}

function ExecErrorPanel({ error }: { error: ResultTableError }) {
  return (
    <div className="space-y-3">
      <div
        className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
        role="alert"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="font-medium text-destructive">
            Không mô phỏng được — câu lệnh lỗi khi chạy
          </p>
          <p className="text-muted-foreground">{error.message}</p>
          {error.hint && (
            <p className="text-xs text-muted-foreground">💡 {error.hint}</p>
          )}
        </div>
      </div>
      <ResultTable result={null} error={error} hasRun />
    </div>
  );
}

/** Static fallback for queries we can run but don't animate in detail. */
function StaticFallback({
  db,
  query,
  tables,
  message,
}: {
  db: SqlDatabase;
  query: string;
  tables: string[];
  message?: string;
}) {
  const preview = React.useMemo(() => {
    const out: { name: string; result: ReturnType<SqlDatabase["exec"]> | null }[] =
      [];
    for (const t of tables) {
      try {
        out.push({ name: t, result: db.exec(`SELECT * FROM ${t} LIMIT 6`) });
      } catch {
        out.push({ name: t, result: null });
      }
    }
    return out;
  }, [db, tables]);

  const queryResult = React.useMemo(() => {
    try {
      return { result: db.exec(query), error: null as null | string };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "lỗi" };
    }
  }, [db, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-clause-limit/40 bg-clause-limit/5 p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-clause-limit" />
        <p>
          {message ??
            "Truy vấn này chạy được nhưng chưa hỗ trợ animation chi tiết. Bạn vẫn có thể xem kết quả và dữ liệu mẫu bên dưới."}
        </p>
      </div>

      <QueryClauseView query={query} />

      {queryResult.result && queryResult.result.columns.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Kết quả</p>
          <ResultTable result={queryResult.result} error={null} hasRun />
        </div>
      )}

      {queryResult.error && (
        <ResultTable
          result={null}
          error={{
            message: queryResult.error,
            original: queryResult.error,
          }}
          hasRun
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {preview.map(
          (p) =>
            p.result && (
              <div key={p.name} className="space-y-1.5">
                <p className="font-mono text-xs font-medium text-muted-foreground">
                  {p.name}
                </p>
                <ResultTable result={p.result} error={null} hasRun />
              </div>
            ),
        )}
      </div>
    </div>
  );
}

/** Plan-driven animated visualizer (select / join / group / mutation). */
function AnimatedVisualizer({
  db,
  query,
  type,
  authoredSteps,
  tables,
  isCanonical,
}: {
  db: SqlDatabase;
  query: string;
  type: VisualizationType;
  authoredSteps?: LessonStep[];
  tables: string[];
  isCanonical: boolean;
}) {
  // `procedure` is intercepted by QueryVisualizer before this component.
  // Keep a defensive fallback so the planner only receives its supported set.
  const preferred =
    type === "none" || type === "procedure" || type === "cursor"
      ? "none"
      : type;
  const plan = React.useMemo(
    () =>
      buildVizPlan(db, query, preferred, authoredSteps, {
        canonical: isCanonical,
      }),
    [db, query, preferred, authoredSteps, isCanonical],
  );

  const frames = plan.kind === "none" ? [] : plan.frames;
  const player = useStepPlayer(Math.max(frames.length, 1));

  if (plan.kind === "none") {
    return (
      <StaticFallback
        db={db}
        query={query}
        tables={tables}
        message={plan.message}
      />
    );
  }

  const current = Math.min(player.current, frames.length - 1);
  const frame = frames[current];
  const activeClause: SqlClause = frame.clause;

  return (
    <div className="space-y-4">
      <QueryClauseView query={query} activeClause={activeClause} />
      <StepController player={player} frames={frames} />

      {/* Current step narration */}
      <div
        className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <ClauseChip clause={activeClause} active />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{frame.title}</p>
          <p className="text-sm text-muted-foreground">{frame.description}</p>
        </div>
      </div>

      {/* Animation stage */}
      <div className="rounded-lg border bg-card/30 p-3">
        {plan.kind === "select" && (
          <TableVisualizer
            data={plan}
            activeClause={activeClause}
            step={current}
          />
        )}
        {plan.kind === "join" && (
          <JoinVisualizer data={plan} activeClause={activeClause} step={current} />
        )}
        {plan.kind === "group" && (
          <GroupByVisualizer data={plan} activeClause={activeClause} />
        )}
        {plan.kind === "mutation" && (
          <MutationVisualizer data={plan} step={current} />
        )}
        {plan.kind === "cte" && (
          <CteVisualizer data={plan} activeClause={activeClause} />
        )}
        {plan.kind === "subquery" && (
          <SubqueryVisualizer data={plan} step={current} />
        )}
        {plan.kind === "window" && (
          <WindowVisualizer
            data={plan}
            activeClause={activeClause}
            step={current}
          />
        )}
      </div>

      {/* Final result for pipeline visualizers (others embed their own result stage) */}
      {(plan.kind === "select" ||
        plan.kind === "join" ||
        plan.kind === "group") &&
        plan.result.columns.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" /> Kết quả cuối cùng
            </p>
            <ResultTable result={plan.result} error={null} hasRun />
          </div>
        )}
    </div>
  );
}

export function QueryVisualizer({
  db,
  query,
  type,
  oracleVariant,
  oracleCursorVariant,
  authoredSteps,
  tables,
  isCanonical = false,
  execError = null,
}: QueryVisualizerProps) {
  if (!db) return <LoadingStage />;

  if (execError) {
    return <ExecErrorPanel error={execError} />;
  }

  // Dedicated demos only while still on the lesson's canonical query.
  if (type === "index" && isCanonical) {
    return <IndexVisualizer db={db} query={query} />;
  }
  if (type === "transaction" && isCanonical) {
    return <TransactionVisualizer db={db} query={query} />;
  }
  if (type === "procedure") {
    return (
      <ProcedureVisualizer
        db={db}
        query={query}
        variant={oracleVariant}
        authoredSteps={authoredSteps}
      />
    );
  }
  if (type === "cursor") {
    return (
      <CursorVisualizer
        db={db}
        query={query}
        variant={oracleCursorVariant}
        authoredSteps={authoredSteps}
      />
    );
  }

  return (
    <AnimatedVisualizer
      db={db}
      query={query}
      type={type}
      authoredSteps={authoredSteps}
      tables={tables}
      isCanonical={isCanonical}
    />
  );
}

// Re-export for convenience.
export { CLAUSE_META };
