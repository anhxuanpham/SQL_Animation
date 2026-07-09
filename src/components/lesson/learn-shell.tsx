"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import { LessonSidebar } from "./lesson-sidebar";
import { Button } from "@/components/ui/button";

export function LearnShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mx-auto flex w-full max-w-[1700px] flex-1">
      {/* Desktop sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r bg-sidebar lg:block">
        <LessonSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-2 lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Menu className="size-4" /> Danh sách bài học
          </Button>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-72 max-w-[82%] border-r bg-sidebar shadow-xl">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <LessonSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
