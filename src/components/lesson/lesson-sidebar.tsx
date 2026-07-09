"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, GraduationCap, RotateCcw } from "lucide-react";

import { LEARNING_PATH, LEVEL_BADGE_VARIANT } from "@/lib/lessons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

export function LessonSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const {
    isLessonComplete,
    completedLessonCount,
    totalLessons,
    reset,
  } = useProgress();
  const pct = totalLessons > 0 ? (completedLessonCount / totalLessons) * 100 : 0;

  const handleReset = React.useCallback(() => {
    if (completedLessonCount === 0) return;
    const ok = window.confirm(
      "Xóa toàn bộ tiến độ học trên thiết bị này? Thao tác không thể hoàn tác.",
    );
    if (ok) reset();
  }, [completedLessonCount, reset]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="size-4 text-primary" />
          Lộ trình học SQL
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={pct} className="h-1.5" />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {completedLessonCount}/{totalLessons}
          </span>
        </div>
        {completedLessonCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full justify-start gap-1.5 px-1 text-xs text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="size-3" />
            Đặt lại tiến độ
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-5 px-3 py-4">
          {LEARNING_PATH.map((section) => (
            <div key={section.level}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {section.label}
                </span>
                <Badge variant={LEVEL_BADGE_VARIANT[section.level]} className="text-[10px]">
                  {section.lessons.length}
                </Badge>
              </div>
              <ul className="space-y-0.5">
                {section.lessons.map((lesson) => {
                  const active = pathname === `/learn/${lesson.id}`;
                  const done = isLessonComplete(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/${lesson.id}`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <Circle
                            className={cn(
                              "size-4 shrink-0",
                              active ? "text-primary" : "text-muted-foreground/40",
                            )}
                          />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
