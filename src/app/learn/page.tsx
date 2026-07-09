import type { Metadata } from "next";

import { LearnOverview } from "@/components/lesson/learn-overview";

export const metadata: Metadata = {
  title: "Lộ trình học",
  description:
    "Toàn bộ lộ trình học SQL từ cơ bản đến nâng cao với animation và thực hành.",
};

export default function LearnPage() {
  return <LearnOverview />;
}
