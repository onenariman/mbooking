import NavbarMenu from "@/components/Navbar";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { Devtools } from "@/src/devtools/devtools";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <header className="mx-auto max-w-5xl px-4 mt-5">
          <nav className="flex items-center gap-x-4 justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              Главная
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
