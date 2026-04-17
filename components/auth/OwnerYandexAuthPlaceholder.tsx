import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";

export function OwnerYandexAuthBlock({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4", className)}>
      <Button
        asChild
        variant="outline"
        className="h-11 w-full gap-2 rounded-4xl border-[#FC3F1E]/35 bg-white text-[#0d0d0d] hover:border-[#FC3F1E]/55 hover:bg-[#FFF5F3]"
      >
        <Link href="/api/auth/yandex/start">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#FC3F1E] text-sm font-bold leading-none text-white"
            aria-hidden
          >
            Я
          </span>
          <span>Войти с Яндекс ID</span>
        </Link>
      </Button>
    </div>
  );
}
