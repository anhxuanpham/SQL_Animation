"use client";

import * as React from "react";
import {
  Lightbulb,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SqlEditor } from "@/components/editor/sql-editor";
import { ResultTable } from "@/components/editor/result-table";
import { cn } from "@/lib/utils";
import type { ExerciseSpec, SqlDialect } from "@/lib/lessons/types";
import { checkExercise, type CheckResult } from "@/lib/lessons/exercise-checker";

interface ExercisePanelProps {
  exercises: ExerciseSpec[];
  completedIds: Set<string>;
  onComplete: (exerciseId: string) => void;
  dialect?: SqlDialect;
}

function ExerciseCard({
  exercise,
  index,
  completed,
  onComplete,
  dialect,
}: {
  exercise: ExerciseSpec;
  index: number;
  completed: boolean;
  onComplete: (id: string) => void;
  dialect: SqlDialect;
}) {
  const [value, setValue] = React.useState(exercise.starterQuery ?? "");
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<CheckResult | null>(null);
  const [showHint, setShowHint] = React.useState(false);
  const [showSolution, setShowSolution] = React.useState(false);
  const [failCount, setFailCount] = React.useState(0);
  const canRevealSolution = completed || failCount >= 2 || showHint;

  const handleCheck = React.useCallback(async () => {
    setChecking(true);
    try {
      const res = await checkExercise(exercise, value);
      setResult(res);
      if (res.status === "pass") onComplete(exercise.id);
      else if (res.status === "fail") setFailCount((c) => c + 1);
    } catch {
      setResult({
        status: "error",
        message: "Không kiểm tra được. Cơ sở dữ liệu chưa sẵn sàng.",
        learnerResult: null,
      });
    } finally {
      setChecking(false);
    }
  }, [exercise, value, onComplete]);

  return (
    <div className="rounded-lg border bg-card/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed">{exercise.prompt}</p>
        </div>
        {completed && (
          <Badge variant="beginner" className="shrink-0 gap-1">
            <CheckCircle2 className="size-3" /> Hoàn thành
          </Badge>
        )}
      </div>

      <SqlEditor
        value={value}
        onChange={setValue}
        onRun={handleCheck}
        minHeight="90px"
        dialect={dialect}
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleCheck} disabled={checking} className="gap-1.5">
          {checking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ClipboardCheck className="size-3.5" />
          )}
          Kiểm tra
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowHint((v) => !v)}
          className="gap-1.5"
        >
          <Lightbulb className="size-3.5" /> Gợi ý
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (!canRevealSolution) return;
            setShowSolution((v) => !v);
          }}
          disabled={!canRevealSolution}
          className="gap-1.5"
          title={
            canRevealSolution
              ? "Xem đáp án mẫu"
              : "Thử ít nhất 2 lần hoặc xem gợi ý trước"
          }
        >
          <Eye className="size-3.5" /> Đáp án
          {!canRevealSolution && (
            <span className="text-[10px] text-muted-foreground">
              ({2 - failCount} lần nữa)
            </span>
          )}
        </Button>
      </div>

      {showHint && (
        <p className="mt-2.5 flex items-start gap-2 rounded-md bg-warning/10 p-2.5 text-xs text-foreground/90">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
          {exercise.hint}
        </p>
      )}

      {showSolution && (
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Đáp án mẫu
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => setValue(exercise.solutionQuery)}
            >
              Điền vào ô soạn thảo
            </Button>
          </div>
          <pre className="overflow-auto rounded-md border bg-muted/50 p-2.5 font-mono text-xs">
            {exercise.solutionQuery}
          </pre>
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          <div
            className={cn(
              "flex items-start gap-2 rounded-md p-2.5 text-sm",
              result.status === "pass" && "bg-success/10 text-foreground",
              result.status === "fail" && "bg-destructive/10 text-foreground",
              result.status === "error" && "bg-warning/10 text-foreground",
            )}
          >
            {result.status === "pass" && (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            )}
            {result.status === "fail" && (
              <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            )}
            {result.status === "error" && (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <div className="min-w-0 space-y-1">
              <span>{result.message}</span>
              {result.diffSummary && (
                <p className="text-xs text-muted-foreground">
                  {result.diffSummary}
                </p>
              )}
            </div>
          </div>
          {result.status === "fail" &&
            (result.learnerResult || result.expectedResult) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kết quả của bạn
                  </p>
                  {result.learnerResult ? (
                    <ResultTable
                      result={result.learnerResult}
                      error={null}
                      hasRun
                      maxRows={20}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      (không có bảng kết quả)
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kết quả kỳ vọng
                  </p>
                  {result.expectedResult ? (
                    <ResultTable
                      result={result.expectedResult}
                      error={null}
                      hasRun
                      maxRows={20}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      (không có bảng kỳ vọng)
                    </p>
                  )}
                </div>
              </div>
            )}
          {result.status !== "fail" &&
            result.learnerResult &&
            result.learnerResult.columns.length > 0 && (
              <ResultTable result={result.learnerResult} error={null} hasRun />
            )}
        </div>
      )}
    </div>
  );
}

export function ExercisePanel({
  exercises,
  completedIds,
  onComplete,
  dialect = "sqlite",
}: ExercisePanelProps) {
  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Bài học này chưa có bài tập.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {exercises.map((ex, i) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          index={i}
          completed={completedIds.has(ex.id)}
          onComplete={onComplete}
          dialect={dialect}
        />
      ))}
    </div>
  );
}
