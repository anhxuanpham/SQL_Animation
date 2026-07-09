"use client";

import * as React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import { useTheme } from "next-themes";

import { TABLE_SCHEMAS } from "@/lib/db/seed";

export interface EditorErrorMarker {
  line?: number;
  message: string;
}

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  editable?: boolean;
  minHeight?: string;
  errorMarkers?: EditorErrorMarker[];
}

const AUTOCOMPLETE_SCHEMA: Record<string, string[]> = Object.fromEntries(
  Object.values(TABLE_SCHEMAS).map((t) => [
    t.name,
    t.columns.map((c) => c.name),
  ]),
);

const baseTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    backgroundColor: "transparent",
  },
  ".cm-content": {
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    padding: "12px 0",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--muted-foreground)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--muted) 45%, transparent)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-error-line": {
    backgroundColor: "color-mix(in oklab, var(--destructive) 14%, transparent)",
  },
});

const setErrorLines = StateEffect.define<number[]>();

const errorLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setErrorLines)) {
        const marks = e.value
          .filter((line) => line >= 1)
          .map((line) => {
            const l = tr.state.doc.line(Math.min(line, tr.state.doc.lines));
            return Decoration.line({ class: "cm-error-line" }).range(l.from);
          });
        deco = Decoration.set(marks, true);
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function guessErrorLine(
  sql: string,
  original: string,
): number | undefined {
  const lineMatch = /line\s+(\d+)/i.exec(original);
  if (lineMatch) return parseInt(lineMatch[1], 10);
  const near = /near\s+"([^"]+)"/i.exec(original);
  if (near) {
    const token = near[1];
    const idx = sql.toLowerCase().indexOf(token.toLowerCase());
    if (idx >= 0) {
      return sql.slice(0, idx).split("\n").length;
    }
  }
  return 1;
}

export default function CodeMirrorEditor({
  value,
  onChange,
  onRun,
  editable = true,
  minHeight = "150px",
  errorMarkers,
}: CodeMirrorEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const viewRef = React.useRef<EditorView | null>(null);

  const extensions = React.useMemo(
    () => [
      sql({
        dialect: SQLite,
        schema: AUTOCOMPLETE_SCHEMA,
        upperCaseKeywords: true,
      }),
      baseTheme,
      EditorView.lineWrapping,
      errorLineField,
    ],
    [],
  );

  React.useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const lines =
      errorMarkers
        ?.map((m) => m.line)
        .filter((n): n is number => typeof n === "number") ?? [];
    view.dispatch({ effects: setErrorLines.of(lines) });
  }, [errorMarkers, value]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onRun?.();
      }
    },
    [onRun],
  );

  return (
    <div onKeyDown={handleKeyDown} className="text-left">
      <CodeMirror
        value={value}
        onChange={onChange}
        editable={editable}
        theme={isDark ? oneDark : "light"}
        extensions={extensions}
        minHeight={minHeight}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: editable,
          highlightActiveLineGutter: editable,
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
        }}
      />
    </div>
  );
}
