import Link from "next/link";
import {
  BookOpen,
  MonitorPlay,
  FlaskConical,
  ArrowRight,
  Sparkles,
  Database,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroDemo } from "@/components/home/hero-demo";
import { FIRST_LESSON_ID, LEARNING_PATH } from "@/lib/lessons";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Lý thuyết ngắn gọn",
    desc: "Mỗi khái niệm được giải thích cô đọng, dễ hiểu, kèm thuật ngữ có tooltip.",
  },
  {
    icon: MonitorPlay,
    title: "Animation trực quan",
    desc: "Xem từng bước FROM → WHERE → SELECT → ORDER BY chạy như thế nào, có điều khiển Play/Pause.",
  },
  {
    icon: FlaskConical,
    title: "Thực hành theo dialect",
    desc: "SQLite chạy thật trong trình duyệt; Oracle PL/SQL có editor riêng, mô phỏng procedure/cursor và chấm cấu trúc.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              Học SQL qua animation, chạy thật trên trình duyệt
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Học SQL bằng cách{" "}
              <span className="text-gradient">nhìn thấy query chạy</span> như thế
              nào
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Không chỉ đọc lý thuyết. Mỗi câu lệnh được mô phỏng trực quan từng
              bước, kèm khu vực thực hành để bạn tự viết và chạy query.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-1.5">
                <Link href={`/learn/${FIRST_LESSON_ID}`}>
                  Bắt đầu học <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/learn">Xem lộ trình</Link>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Database className="size-3.5" />
              {LEARNING_PATH.reduce((n, s) => n + s.lessons.length, 0)}+ bài học ·
              Cơ bản → Nâng cao → Oracle PL/SQL
            </p>
          </div>

          <div className="lg:pl-6">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-0">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Levels */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Lộ trình rõ ràng theo từng cấp độ
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {LEARNING_PATH.map((section) => (
            <Card key={section.id} className="gap-3">
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{section.label}</h3>
                  <span className="text-sm text-muted-foreground">
                    {section.lessons.length} bài
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {section.lessons.slice(0, 6).map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${l.id}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <span className="size-1.5 rounded-full bg-primary/50" />
                        {l.title}
                      </Link>
                    </li>
                  ))}
                  {section.lessons.length > 6 && (
                    <li className="pl-3.5 text-sm text-muted-foreground/70">
                      + {section.lessons.length - 6} bài khác…
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild size="lg" className="gap-1.5">
            <Link href={`/learn/${FIRST_LESSON_ID}`}>
              Vào học ngay <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
