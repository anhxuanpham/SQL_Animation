"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import type { CodeMirrorEditorProps } from "./code-mirror-editor";

// CodeMirror touches the DOM, so load it only on the client. A lightweight
// <pre> fallback keeps layout stable during the (brief) load.
const CodeMirrorEditor = dynamic(() => import("./code-mirror-editor"), {
  ssr: false,
  loading: () => (
    <pre className="min-h-[150px] px-4 py-3 font-mono text-[13px] text-muted-foreground">
      Đang tải trình soạn thảo…
    </pre>
  ),
});

export interface SqlEditorProps extends CodeMirrorEditorProps {
  className?: string;
}

export function SqlEditor({ className, ...props }: SqlEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card/60 focus-within:ring-1 focus-within:ring-ring/50",
        className,
      )}
    >
      <CodeMirrorEditor {...props} />
    </div>
  );
}
