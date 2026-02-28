import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";
import NavbarMenu from "@/components/Navbar";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Devtools } from "@/src/devtools/devtools";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Мумина онлайн запись",
  description: "Управление клиентами",
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${notoSans.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="mx-auto mt-5 max-w-5xl px-4">
            <nav className="flex items-center justify-between">
              <Link href="/">
                <span className="cursor-pointer text-2xl font-medium tracking-wide transition-opacity hover:opacity-80">
                  Reception
                </span>
              </Link>
              <NavbarMenu />
            </nav>
          </header>

          <main className="mx-auto mt-5 max-w-5xl px-4">
            <TanstackProvider>
              {children}
              <Devtools />
            </TanstackProvider>
            <Toaster position="top-center" closeButton />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
