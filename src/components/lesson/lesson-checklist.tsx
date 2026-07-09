"use client";

import * as React from "react";
import { CheckCircle2, Circle, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  label: string;
  done: boolean;
}

export function LessonChecklist({
  hasRun,
  exercisesDone,
  totalExercises,
  lessonComplete,
  onToggleComplete,
}: {
  hasRun: boolean;
  exercisesDone: number;
  totalExercises: number;
  lessonComplete: boolean;
  onToggleComplete: (value: boolean) => void;
}) {
  const items: ChecklistItem[] = [
    { label: "Chạy thử truy vấn mẫu", done: hasRun },
    {
      label:
        totalExercises > 0
          ? `Hoàn thành bài tập (${exercisesDone}/${totalExercises})`
          : "Đọc lý thuyết",
      done: totalExercises > 0 ? exercisesDone >= totalExercises : true,
    },
  ];

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <Circle className="size-4 text-muted-foreground/40" />
            )}
            <span className={cn(item.done && "text-muted-foreground line-through")}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={lessonComplete ? "success" : "default"}
        className="w-full gap-1.5"
        onClick={() => onToggleComplete(!lessonComplete)}
      >
        <Trophy className="size-4" />
        {lessonComplete ? "Đã hoàn thành bài học" : "Đánh dấu hoàn thành bài học"}
      </Button>
    </div>
  );
}
