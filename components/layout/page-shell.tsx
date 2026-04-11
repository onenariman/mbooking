import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

type PageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Единая шапка страницы мастера + отступ снизу под мобильный tab bar.
 */
export function PageShell({ title, description, children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col gap-6 pb-24 md:max-w-5xl md:pb-10 min-h-dvh",
        className,
      )}
    >
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
