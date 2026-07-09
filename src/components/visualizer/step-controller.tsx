"use client";

import * as React from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PlaybackSpeed, StepPlayer } from "@/hooks/use-step-player";
import type { Frame } from "@/lib/visualizer/plan";
import { CLAUSE_META } from "@/lib/lessons/types";

const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  slow: "Chậm",
  normal: "Vừa",
  fast: "Nhanh",
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  // CodeMirror content area
  if (el.closest(".cm-editor") || el.closest(".cm-content")) return true;
  return false;
}

export function StepController({
  player,
  frames,
}: {
  player: StepPlayer;
  frames?: Frame[];
}) {
  const { current, total, isPlaying } = player;
  const progress = total > 1 ? (current / (total - 1)) * 100 : 0;
  const rootRef = React.useRef<HTMLDivElement>(null);

  const { next, prev, toggle, reset } = player;

  // Keyboard: ←/→ step, Space play/pause (when not typing in an editor).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Home") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, toggle, reset]);

  return (
    <div ref={rootRef} className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {String(current + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <Progress value={progress} className="h-1.5 flex-1" />
      </div>

      {/* Clickable step timeline */}
      {frames && frames.length > 1 && (
        <div
          className="flex flex-wrap gap-1"
          role="tablist"
          aria-label="Các bước mô phỏng"
        >
          {frames.map((frame, i) => {
            const meta = CLAUSE_META[frame.clause];
            const active = i === current;
            return (
              <button
                key={`${frame.clause}-${i}`}
                type="button"
                role="tab"
                aria-selected={active}
                title={frame.title}
                onClick={() => player.goTo(i)}
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "mr-1 inline-block size-1.5 rounded-full align-middle",
                    active ? `bg-${meta.token}` : "bg-muted-foreground/40",
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: `var(--${meta.token})`,
                        }
                      : undefined
                  }
                />
                {frame.clause}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={player.reset}
          aria-label="Về đầu"
          disabled={player.atStart && !isPlaying}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={player.prev}
          aria-label="Bước trước"
          disabled={player.atStart}
        >
          <SkipBack className="size-4" />
        </Button>
        <Button
          size="sm"
          onClick={player.toggle}
          className="min-w-[92px] gap-1.5"
          aria-label={isPlaying ? "Tạm dừng" : "Chạy"}
        >
          {isPlaying ? (
            <>
              <Pause className="size-4" /> Dừng
            </>
          ) : (
            <>
              <Play className="size-4" /> Chạy
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={player.next}
          aria-label="Bước sau"
          disabled={player.atEnd}
        >
          <SkipForward className="size-4" />
        </Button>

        <div
          className="ml-auto flex items-center gap-1 rounded-md border p-0.5"
          role="radiogroup"
          aria-label="Tốc độ phát"
        >
          <Gauge className="mx-1 size-3.5 text-muted-foreground" />
          {(["slow", "normal", "fast"] as PlaybackSpeed[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={player.speed === s}
              onClick={() => player.setSpeed(s)}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                player.speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {SPEED_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Phím tắt: ← → bước · Space chạy/dừng · Home về đầu
      </p>
    </div>
  );
}
