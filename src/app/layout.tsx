import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sql-visual-academy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SQL Visual Academy — Học SQL bằng cách nhìn thấy query chạy",
    template: "%s · SQL Visual Academy",
  },
  description:
    "Nền tảng học SQL từ cơ bản đến nâng cao với animation mô phỏng trực quan quá trình thực thi câu lệnh và trình soạn thảo SQL chạy thật trên trình duyệt.",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "SQL Visual Academy",
    title: "SQL Visual Academy — Học SQL bằng animation",
    description:
      "Mô phỏng từng bước FROM → WHERE → SELECT, chạy SQLite thật trong trình duyệt.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Visual Academy",
    description: "Học SQL bằng cách nhìn thấy query chạy.",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={150}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex flex-1 flex-col">{children}</div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
