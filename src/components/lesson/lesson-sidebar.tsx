"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  GraduationCap,
  RotateCcw,
} from "lucide-react";

import { LEARNING_PATH, LEVEL_BADGE_VARIANT } from "@/lib/lessons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

function sectionFromPathname(pathname: string): string | null {
  for (const section of LEARNING_PATH) {
    if (section.lessons.some((lesson) => pathname === `/learn/${lesson.id}`)) {
      return section.id;
    }
  }
  return null;
}

export function LessonSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const {
    isLessonComplete,
    completedLessonCount,
    totalLessons,
    reset,
  } = useProgress();
  const pct = totalLessons > 0 ? (completedLessonCount / totalLessons) * 100 : 0;
  const activeSection = sectionFromPathname(pathname);

  // Sections start expanded; users can collapse any of them.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [prevActiveSection, setPrevActiveSection] =
    React.useState(activeSection);

  // When navigating into a section, re-expand it so the active lesson is visible.
  // (React-recommended "adjust state when props change" pattern — no effect needed.)
  if (activeSection !== prevActiveSection) {
    setPrevActiveSection(activeSection);
    if (activeSection && collapsed.has(activeSection)) {
      const next = new Set(collapsed);
      next.delete(activeSection);
      setCollapsed(next);
    }
  }

  const toggleSection = React.useCallback((sectionId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleReset = React.useCallback(() => {
    if (completedLessonCount === 0) return;
    const ok = window.confirm(
      "Xóa toàn bộ tiến độ học trên thiết bị này? Thao tác không thể hoàn tác.",
    );
    if (ok) reset();
  }, [completedLessonCount, reset]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b px-4 py-3">
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

      {/*
        Native overflow scrolling is more reliable than Radix ScrollArea inside
        a sticky flex sidebar (flex children need min-h-0 + a real overflow box).
      */}
      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-gutter:stable]"
        aria-label="Danh sách bài học"
      >
        {LEARNING_PATH.map((section) => {
          const isOpen = !collapsed.has(section.id);
          const completedInSection = section.lessons.filter((lesson) =>
            isLessonComplete(lesson.id),
          ).length;
          const sectionActive = activeSection === section.id;

          return (
            <div key={section.id} className="rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                  "hover:bg-sidebar-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  sectionActive && "bg-sidebar-accent/40",
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    !isOpen && "-rotate-90",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {section.label}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/80">
                  {completedInSection}/{section.lessons.length}
                </span>
                <Badge
                  variant={LEVEL_BADGE_VARIANT[section.level]}
                  className="text-[10px]"
                >
                  {section.lessons.length}
                </Badge>
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-0.5 pb-2 pl-1">
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
                                  active
                                    ? "text-primary"
                                    : "text-muted-foreground/40",
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
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
