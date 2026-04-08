"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";
import { ClientLogoutButton } from "./ClientLogoutButton";

const navItems = [
  {
    href: "/client",
    label: "Главная",
  },
  {
    href: "/client/appointments",
    label: "Записи",
  },
  {
    href: "/client/discounts",
    label: "Скидки",
  },
  {
    href: "/client/settings",
    label: "Настройки",
  },
] as const;

export function ClientPortalHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const pathname = usePathname();

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Клиентский кабинет</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <ClientLogoutButton />
      </div>

      <nav className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/client" && pathname.startsWith(item.href));

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "default" : "outline"}
              className={cn("rounded-full")}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
      </nav>
    </header>
  );
}
