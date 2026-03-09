"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavbarMenu from "@/components/Navbar";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { Devtools } from "@/src/devtools/devtools";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isPublicFeedbackRoute = pathname.startsWith("/feedback/");

  if (isPublicFeedbackRoute) {
    return (
      <main className="mx-auto mt-5 max-w-5xl px-4">
        <TanstackProvider>
          {children}
          <Devtools />
        </TanstackProvider>
        <Toaster position="top-center" closeButton />
      </main>
    );
  }

  return (
    <>
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
    </>
  );
}
