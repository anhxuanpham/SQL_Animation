"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  BookOpen,
  FlaskConical,
  ListChecks,
  MonitorPlay,
  Database,
  AlertCircle,
  PartyPopper,
  Share2,
} from "lucide-react";

import type { Lesson } from "@/lib/lessons/types";
import type { AdjacentLessons } from "@/lib/lessons";
import { LEVEL_LABELS, LEVEL_BADGE_VARIANT } from "@/lib/lessons/types";
import { useSqlDatabase } from "@/hooks/use-sql-database";
import { useProgress } from "@/hooks/use-progress";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Theory } from "./theory";
import { SampleData } from "./sample-data";
import { ExercisePanel } from "./exercise-panel";
import { LessonChecklist } from "./lesson-checklist";
import { SqlPlayground } from "@/components/editor/sql-playground";
import { QueryVisualizer } from "@/components/visualizer/query-visualizer";
import { cn } from "@/lib/utils";

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <CardTitle className="flex items-center gap-2 text-base">
      <Icon className="size-4 text-primary" />
      {children}
    </CardTitle>
  );
}

export function LessonWorkspace({
  lesson,
  adjacent,
}: {
  lesson: Lesson;
  adjacent: AdjacentLessons;
}) {
  const { ready, run, reset, db, loadError } = useSqlDatabase();
  const {
    completedExercises,
    isLessonComplete,
    markExerciseComplete,
    markLessonComplete,
    completedLessonCount,
    totalLessons,
  } = useProgress();

  const canonicalQuery = lesson.visualization.query ?? lesson.initialQuery;
  const dialect = lesson.dialect ?? "sqlite";
  const isOracle = dialect === "oracle";

  const [query, setQuery] = React.useState(lesson.initialQuery);
  const [vizQuery, setVizQuery] = React.useState(canonicalQuery);
  const [outcome, setOutcome] = React.useState<{
    result: ReturnType<typeof run>["result"];
    error: ReturnType<typeof run>["error"];
  } | null>(null);
  const [hasRun, setHasRun] = React.useState(false);
  const [dataVersion, setDataVersion] = React.useState(0);
  const [resetting, setResetting] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState("theory");
  const [shareNote, setShareNote] = React.useState<string | null>(null);
  const vizRef = React.useRef<HTMLDivElement>(null);

  const doneSet = completedExercises(lesson.id);
  const exercisesDone = lesson.exercises.filter((e) => doneSet.has(e.id)).length;
  const totalExercises = lesson.exercises.length;
  const lessonComplete = isLessonComplete(lesson.id);
  const courseComplete =
    completedLessonCount >= totalLessons && totalLessons > 0;

  const handleRun = React.useCallback(() => {
    if (isOracle) {
      setOutcome(null);
    } else {
      const oc = run(query);
      setOutcome(oc);
      setDataVersion((v) => v + 1);
    }
    setHasRun(true);
    setVizQuery(query);
    // On mobile, jump to the visualizer tab after run
    setMobileTab("viz");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        vizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [run, query, isOracle]);

  const handleReset = React.useCallback(() => {
    setResetting(true);
    reset();
    if (isOracle) {
      setQuery(lesson.initialQuery);
      setVizQuery(canonicalQuery);
    }
    setOutcome(null);
    setHasRun(false);
    setDataVersion((v) => v + 1);
    setTimeout(() => setResetting(false), 250);
  }, [reset, isOracle, lesson.initialQuery, canonicalQuery]);

  const handleExerciseComplete = React.useCallback(
    (exId: string) => {
      markExerciseComplete(lesson.id, exId);
    },
    [markExerciseComplete, lesson.id],
  );

  React.useEffect(() => {
    if (
      totalExercises > 0 &&
      exercisesDone >= totalExercises &&
      !lessonComplete
    ) {
      markLessonComplete(lesson.id, true);
    }
  }, [
    exercisesDone,
    totalExercises,
    lessonComplete,
    lesson.id,
    markLessonComplete,
  ]);

  const isCanonical = vizQuery.trim() === canonicalQuery.trim();
  const authoredSteps = isCanonical ? lesson.steps : undefined;
  const vizError =
    hasRun && outcome?.error
      ? {
          message: outcome.error.message,
          hint: outcome.error.hint,
          original: outcome.error.original,
        }
      : null;

  const handleShare = React.useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/learn/${lesson.id}`
        : `/learn/${lesson.id}`;
    const text = `${lesson.title} — SQL Visual Academy\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: lesson.title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Đã copy link bài học");
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }, [lesson.id, lesson.title]);

  const theoryBlock = (
    <>
      <Card>
        <CardHeader>
          <SectionTitle icon={BookOpen}>Lý thuyết</SectionTitle>
        </CardHeader>
        <CardContent>
          <Theory body={lesson.theory} keyTerms={lesson.keyTerms} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionTitle icon={Database}>Dữ liệu mẫu</SectionTitle>
        </CardHeader>
        <CardContent>
          <SampleData db={db} tables={lesson.tables} version={dataVersion} />
        </CardContent>
      </Card>
    </>
  );

  const practiceBlock = (
    <>
      <Card>
        <CardHeader>
          <SectionTitle icon={MonitorPlay}>Khu vực thực hành</SectionTitle>
        </CardHeader>
        <CardContent>
          <SqlPlayground
            query={query}
            onQueryChange={setQuery}
            onRun={handleRun}
            onReset={handleReset}
            outcome={outcome}
            hasRun={hasRun}
            ready={ready}
            resetting={resetting}
            dialect={dialect}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionTitle icon={FlaskConical}>
            Bài tập ({exercisesDone}/{totalExercises})
          </SectionTitle>
        </CardHeader>
        <CardContent>
          <ExercisePanel
            exercises={lesson.exercises}
            completedIds={doneSet}
            onComplete={handleExerciseComplete}
            dialect={dialect}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionTitle icon={ListChecks}>Checklist hoàn thành</SectionTitle>
        </CardHeader>
        <CardContent>
          <LessonChecklist
            hasRun={hasRun}
            exercisesDone={exercisesDone}
            totalExercises={totalExercises}
            lessonComplete={lessonComplete}
            onToggleComplete={(v) => markLessonComplete(lesson.id, v)}
          />
        </CardContent>
      </Card>
    </>
  );

  const vizBlock = (
    <div ref={vizRef}>
      <Card className="border-primary/20">
        <CardHeader>
          <SectionTitle icon={MonitorPlay}>
            Trình mô phỏng thực thi SQL
          </SectionTitle>
        </CardHeader>
        <CardContent>
          <QueryVisualizer
            db={db}
            query={vizQuery}
            type={lesson.visualization.type}
            oracleVariant={lesson.visualization.oracleVariant}
            oracleCursorVariant={lesson.visualization.oracleCursorVariant}
            authoredSteps={authoredSteps}
            tables={lesson.tables}
            isCanonical={isCanonical}
            execError={vizError}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={LEVEL_BADGE_VARIANT[lesson.level]}>
            {LEVEL_LABELS[lesson.level]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {lesson.category}
          </span>
          {lesson.estimatedMinutes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" /> ~{lesson.estimatedMinutes} phút
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 text-xs"
            onClick={handleShare}
          >
            <Share2 className="size-3.5" />
            Chia sẻ
          </Button>
        </div>
        {shareNote && (
          <p className="mb-1 text-xs text-success" role="status">
            {shareNote}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-muted-foreground">
          {lesson.description}
        </p>
      </header>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="size-4" /> Không tải được SQLite: {loadError}
        </div>
      )}

      {lessonComplete && (
        <div
          className={cn(
            "mb-4 flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 p-3 text-sm",
          )}
          role="status"
        >
          <PartyPopper className="mt-0.5 size-4 shrink-0 text-success" />
          <div>
            <p className="font-medium">Bạn đã hoàn thành bài này!</p>
            {courseComplete ? (
              <p className="text-muted-foreground">
                Xuất sắc — bạn đã xong toàn bộ {totalLessons} bài trong lộ trình.
                Thử <Link href="/playground" className="underline">Playground</Link>{" "}
                để luyện thêm.
              </p>
            ) : adjacent.next ? (
              <p className="text-muted-foreground">
                Tiếp theo:{" "}
                <Link
                  href={`/learn/${adjacent.next.id}`}
                  className="font-medium text-primary underline"
                >
                  {adjacent.next.title}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Mobile tabs */}
      <div className="lg:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="theory">Lý thuyết</TabsTrigger>
            <TabsTrigger value="viz">Mô phỏng</TabsTrigger>
            <TabsTrigger value="practice">Thực hành</TabsTrigger>
          </TabsList>
          <TabsContent value="theory" className="space-y-5">
            {theoryBlock}
          </TabsContent>
          <TabsContent value="viz" className="space-y-5">
            {vizBlock}
          </TabsContent>
          <TabsContent value="practice" className="space-y-5">
            {practiceBlock}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop two-column */}
      <div className="hidden grid-cols-1 gap-5 lg:grid lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          {theoryBlock}
          {practiceBlock}
        </div>
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-[4.5rem]">{vizBlock}</div>
        </div>
      </div>

      <nav className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
        {adjacent.prev ? (
          <Button asChild variant="outline" className="gap-1.5">
            <Link href={`/learn/${adjacent.prev.id}`}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{adjacent.prev.title}</span>
              <span className="sm:hidden">Trước</span>
            </Link>
          </Button>
        ) : (
          <span />
        )}
        <span className="text-xs text-muted-foreground">
          Bài {adjacent.index + 1}/{adjacent.total}
        </span>
        {adjacent.next ? (
          <Button asChild className="gap-1.5">
            <Link href={`/learn/${adjacent.next.id}`}>
              <span className="hidden sm:inline">{adjacent.next.title}</span>
              <span className="sm:hidden">Tiếp</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/playground">
              Playground <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
