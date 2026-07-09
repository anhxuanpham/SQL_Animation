"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, RotateCcw } from "lucide-react";

import { LEARNING_PATH, LEVEL_BADGE_VARIANT } from "@/lib/lessons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

export function LearnOverview() {
  const { isLessonComplete, completedLessonCount, totalLessons, reset } =
    useProgress();
  const pct = totalLessons > 0 ? (completedLessonCount / totalLessons) * 100 : 0;

  const handleReset = React.useCallback(() => {
    if (completedLessonCount === 0) return;
    const ok = window.confirm(
      "Xóa toàn bộ tiến độ học trên thiết bị này? Thao tác không thể hoàn tác.",
    );
    if (ok) reset();
  }, [completedLessonCount, reset]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lộ trình học SQL</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Học từ cơ bản đến nâng cao. Mỗi bài có lý thuyết ngắn gọn, trình mô
          phỏng thực thi bằng animation và khu vực thực hành chạy SQL thật.
        </p>
        <div className="mt-4 flex max-w-md flex-wrap items-center gap-3">
          <Progress value={pct} className="h-2 min-w-[12rem] flex-1" />
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {completedLessonCount}/{totalLessons} bài
          </span>
          {completedLessonCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="size-3.5" />
              Đặt lại tiến độ
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-10">
        {LEARNING_PATH.map((section) => (
          <section key={section.level}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xl font-semibold">{section.label}</h2>
              <Badge variant={LEVEL_BADGE_VARIANT[section.level]}>
                {section.lessons.length} bài
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.lessons.map((lesson) => {
                const done = isLessonComplete(lesson.id);
                return (
                  <Link key={lesson.id} href={`/learn/${lesson.id}`} className="group">
                    <Card
                      className={cn(
                        "h-full gap-3 p-4 transition-all hover:border-primary/50 hover:shadow-md",
                        done && "border-success/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-snug group-hover:text-primary">
                          {lesson.title}
                        </h3>
                        {done && (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {lesson.summary}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> ~{lesson.estimatedMinutes ?? 8} phút
                        </span>
                        <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
