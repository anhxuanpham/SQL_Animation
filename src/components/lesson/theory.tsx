"use client";

import * as React from "react";
import { BookText } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KeyTerm } from "@/lib/lessons/types";

/** Render a single line's inline formatting: **bold** and `code`. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-clause-select"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

/** Render the mini-markdown theory body into grouped blocks. */
function renderBlocks(lines: string[]): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = [...bullets];
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="ml-1 space-y-1.5 text-sm text-muted-foreground"
      >
        {items.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>{renderInline(b, `li-${blocks.length}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      return;
    }
    flushBullets();
    if (line.startsWith("## ")) {
      blocks.push(
        <h3
          key={`h-${idx}`}
          className="pt-1 text-sm font-semibold tracking-tight text-foreground"
        >
          {renderInline(line.slice(3), `h-${idx}`)}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`q-${idx}`}
          className="rounded-r-md border-l-2 border-primary/60 bg-primary/5 py-2 pl-3 pr-2 text-sm text-foreground/90"
        >
          {renderInline(line.slice(2), `q-${idx}`)}
        </blockquote>,
      );
    } else if (line.length > 0) {
      blocks.push(
        <p key={`p-${idx}`} className="text-sm leading-relaxed text-muted-foreground">
          {renderInline(line, `p-${idx}`)}
        </p>,
      );
    }
  });
  flushBullets();
  return blocks;
}

interface TheoryProps {
  body: string[];
  keyTerms?: KeyTerm[];
}

export function Theory({ body, keyTerms }: TheoryProps) {
  return (
    <div className="space-y-3">
      {renderBlocks(body)}

      {keyTerms && keyTerms.length > 0 && (
        <div className="mt-4 rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookText className="size-3.5" /> Thuật ngữ (di chuột để xem giải thích)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {keyTerms.map((term) => (
              <Tooltip key={term.term}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-md border border-dashed border-primary/40 bg-background px-2 py-0.5 text-xs font-medium text-foreground/90 underline-offset-2 hover:border-primary hover:text-primary"
                  >
                    {term.term}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{term.definition}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
