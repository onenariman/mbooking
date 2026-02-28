"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, Menu, MonitorCog, Moon, Sun, SunMoon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const themeOptions = [
  { value: "light", label: "Светлая", Icon: Sun },
  { value: "dark", label: "Тёмная", Icon: Moon },
] as const;

const NavbarMenu = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="cursor-pointer">
            <SunMoon />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-1"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <div className="flex flex-col">
            {themeOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "focus:bg-accent focus:text-accent-foreground gap-2.5 rounded-xl px-3 py-2 text-sm relative flex cursor-pointer items-center outline-hidden select-none",
                  theme === value && "bg-accent/60",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {theme === value && <Check className="ml-auto h-4 w-4" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="cursor-pointer">
            <Menu />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-fit"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/receptions">Ресепшен</Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/charts">Статистика</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/categories">Категории</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/services">Услуги</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/clients">Клиенты</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Уход</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Подобрать уход</DropdownMenuItem>
                  <DropdownMenuItem>Товары</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Выйти</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavbarMenu;
