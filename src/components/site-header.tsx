import Link from "next/link";
import { Database, Code2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { FIRST_LESSON_ID } from "@/lib/lessons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Database className="size-4" />
          </span>
          <span className="hidden sm:inline">SQL Visual Academy</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/learn">Bài học</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/playground">Playground</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/learn/${FIRST_LESSON_ID}`}>Bắt đầu</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Mã nguồn">
            <a
              href="https://github.com/anhxuanpham/SQL_Animation"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Code2 className="size-[1.1rem]" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
