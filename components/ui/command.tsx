"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { SearchIcon, CheckIcon } from "lucide-react";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground rounded-4xl p-1 flex size-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "rounded-4xl! top-1/3 translate-y-0 overflow-hidden p-0",
          className,
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="bg-input/30 h-9">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border/50 my-1 h-px", className)}
      {...props}
    />
  );
}

const commandItemVariants = cva(
  "relative flex cursor-default items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground outline-hidden select-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out in-data-[slot=dialog-content]:rounded-2xl data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:*:[svg]:text-foreground [&_svg:not([class*='size-'])]:size-4 group/command-item [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-transparent hover:bg-muted/70 data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
        outline:
          "border border-border/70 bg-input/25 hover:bg-input/45 data-[selected=true]:border-border data-[selected=true]:bg-input/55",
        secondary:
          "bg-secondary/80 text-secondary-foreground hover:bg-secondary data-[selected=true]:bg-secondary data-[selected=true]:text-secondary-foreground",
        ghost:
          "bg-transparent hover:bg-muted/60 data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/15 data-[selected=true]:bg-destructive/20 data-[selected=true]:text-destructive",
        link:
          "text-primary underline-offset-4 hover:bg-primary/10 hover:underline data-[selected=true]:bg-primary/15",
        glass:
          "border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/14 data-[selected=true]:border-white/30 data-[selected=true]:bg-white/18 supports-[backdrop-filter]:bg-white/10",
        glassStrong:
          "border border-white/30 bg-white/15 shadow-[0_10px_28px_-14px_rgba(0,0,0,.45)] backdrop-blur-lg hover:bg-white/20 data-[selected=true]:bg-white/24 supports-[backdrop-filter]:bg-white/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function CommandItem({
  className,
  children,
  variant,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> &
  VariantProps<typeof commandItemVariants>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(commandItemVariants({ variant }), className)}
      {...props}
    >
      {children}
      <CheckIcon className="hidden group-data-[checked=true]/command-item:ml-auto group-data-[checked=true]/command-item:block group-has-data-[slot=command-shortcut]/command-item:hidden" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
