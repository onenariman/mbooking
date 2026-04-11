"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavbarMenu from "@/components/Navbar";
import { OwnerMobileNav } from "@/components/layout/OwnerMobileNav";
import { TanstackProvider } from "@/components/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { Devtools } from "@/src/devtools/devtools";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isPublicFeedbackRoute = pathname.startsWith("/feedback/");
  const isClientRoute = pathname === "/client" || pathname.startsWith("/client/");
  /** Мастер: только форма, без шапки и каркаса (как /login и /register). */
  const isOwnerAuthSurface =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (isPublicFeedbackRoute || isClientRoute) {
    return (
      <main className="mx-auto mt-5 max-w-2xl px-4 md:max-w-5xl">
        <TanstackProvider>
          {children}
          <Devtools />
        </TanstackProvider>
        <Toaster position="top-center" closeButton />
      </main>
    );
  }

  if (isOwnerAuthSurface) {
    return (
      <>
        <TanstackProvider>{children}</TanstackProvider>
        <Toaster position="top-center" closeButton />
      </>
    );
  }

  return (
    <>
      <header className="mx-auto mt-5 max-w-2xl px-4 md:max-w-5xl">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <span className="cursor-pointer text-xl font-semibold tracking-tight transition-opacity hover:opacity-80 md:text-2xl">
              Reception
            </span>
          </Link>
          <NavbarMenu />
        </nav>
      </header>

      <main className="mx-auto mt-5 max-w-2xl px-4 md:max-w-5xl">
        <TanstackProvider>
          {children}
          <Devtools />
        </TanstackProvider>
        <Toaster position="top-center" closeButton />
      </main>
      <OwnerMobileNav />
    </>
  );
}
