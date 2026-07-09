import type { MetadataRoute } from "next";
import { getAllLessonIds } from "@/lib/lessons";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sql-visual-academy.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lessons = getAllLessonIds().map((id) => ({
    url: `${BASE}/learn/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/learn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/playground`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...lessons,
  ];
}
