import NavbarMenu from "@/components/Navbar";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { Devtools } from "@/src/devtools/devtools";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${notoSans.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        {/* subpixel-antialiased обычно четче на Windows/Chrome */}
        <header className="mx-auto max-w-5xl px-4 mt-5">
          <nav className="flex items-center justify-between">
            <Link href="/">
              <span // Используй span или div вместо button, если это просто ссылка-логотип
                className="text-2xl font-medium tracking-wide hover:opacity-80 transition-opacity cursor-pointer"
              >
                Reception
              </span>
            </Link>
            <NavbarMenu />
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 mt-5">
          <TanstackProvider>
            {children}
            <Devtools />
          </TanstackProvider>
          <Toaster position="top-center" closeButton />
        </main>
      </body>
    </html>
  );
}
