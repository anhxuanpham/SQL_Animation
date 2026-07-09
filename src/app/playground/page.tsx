import type { Metadata } from "next";
import { FreePlayground } from "@/components/playground/free-playground";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Viết và chạy SQL tự do với SQLite trong trình duyệt, kèm animation mô phỏng khi được hỗ trợ.",
};

export default function PlaygroundPage() {
  return <FreePlayground />;
}
