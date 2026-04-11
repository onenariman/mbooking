"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, CalendarDays, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";

const NAV = [
  { href: "/receptions", label: "Приём", Icon: CalendarDays },
  { href: "/clients", label: "Клиенты", Icon: Users },
  { href: "/services", label: "Услуги", Icon: Briefcase },
  { href: "/charts", label: "Статистика", Icon: BarChart3 },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/receptions") {
    return pathname === "/receptions";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OwnerMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/90 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Основные разделы"
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-between gap-1 px-1 pt-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground active:text-foreground",
              )}
            >
              <Icon
                className={cn("size-[22px] shrink-0 stroke-[1.75]", active && "stroke-[2.25]")}
                aria-hidden
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
