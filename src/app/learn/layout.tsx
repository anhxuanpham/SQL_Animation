import { LearnShell } from "@/components/lesson/learn-shell";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LearnShell>{children}</LearnShell>;
}
