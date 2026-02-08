import NavbarMenu from "@/components/Navbar";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { Devtools } from "@/src/devtools/devtools";
import { Playwrite_CU_Guides } from "next/font/google";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({ variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export const playwrite = Playwrite_CU_Guides({
  weight: "400",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={notoSans.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playwrite} antialiased`}
      >
        <header className="mx-auto max-w-5xl px-4 mt-5">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              style={{ fontFamily: playwrite.style.fontFamily }}
              className="text-2xl font-medium tracking-wide hover:opacity-80 transition-opacity"
            >
              Reception
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
