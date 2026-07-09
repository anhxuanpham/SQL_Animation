"use client";

import * as React from "react";

export type PlaybackSpeed = "slow" | "normal" | "fast";

export const SPEED_MS: Record<PlaybackSpeed, number> = {
  slow: 2200,
  normal: 1300,
  fast: 700,
};

export interface StepPlayer {
  current: number;
  total: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  setSpeed: (s: PlaybackSpeed) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  goTo: (i: number) => void;
  atStart: boolean;
  atEnd: boolean;
}

/**
 * Drives step-by-step playback for the visualizer. Auto-advances while playing
 * at the selected speed and stops on the last step. Resets whenever `total`
 * changes (e.g. the query being visualized changed).
 */
export function useStepPlayer(total: number): StepPlayer {
  const [current, setCurrent] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<PlaybackSpeed>("normal");

  // Reset when the timeline length changes.
  React.useEffect(() => {
    setCurrent(0);
    setIsPlaying(false);
  }, [total]);

  React.useEffect(() => {
    if (!isPlaying) return;
    if (current >= total - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrent((c) => Math.min(c + 1, total - 1));
    }, SPEED_MS[speed]);
    return () => clearTimeout(timer);
  }, [isPlaying, current, total, speed]);

  const play = React.useCallback(() => {
    setCurrent((c) => (c >= total - 1 ? 0 : c));
    setIsPlaying(true);
  }, [total]);

  const pause = React.useCallback(() => setIsPlaying(false), []);

  const toggle = React.useCallback(() => {
    setIsPlaying((p) => {
      if (!p) {
        setCurrent((c) => (c >= total - 1 ? 0 : c));
        return true;
      }
      return false;
    });
  }, [total]);

  const next = React.useCallback(() => {
    setIsPlaying(false);
    setCurrent((c) => Math.min(c + 1, total - 1));
  }, [total]);

  const prev = React.useCallback(() => {
    setIsPlaying(false);
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  const reset = React.useCallback(() => {
    setIsPlaying(false);
    setCurrent(0);
  }, []);

  const goTo = React.useCallback(
    (i: number) => {
      setIsPlaying(false);
      setCurrent(Math.max(0, Math.min(i, total - 1)));
    },
    [total],
  );

  return {
    current,
    total,
    isPlaying,
    speed,
    setSpeed,
    toggle,
    play,
    pause,
    next,
    prev,
    reset,
    goTo,
    atStart: current === 0,
    atEnd: current >= total - 1,
  };
}
