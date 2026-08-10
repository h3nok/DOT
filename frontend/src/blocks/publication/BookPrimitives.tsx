import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BookActionVariant = "primary" | "secondary" | "quiet";
type BookActionSize = "default" | "compact";

interface BookActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: BookActionSize;
  variant?: BookActionVariant;
}

export function BookAction({
  asChild = false,
  className,
  size = "default",
  variant = "primary",
  ...props
}: BookActionProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        "book-action",
        `book-action-${variant}`,
        `book-action-${size}`,
        className,
      )}
      {...props}
    />
  );
}

type BookCardVariant = "surface" | "accent" | "interactive" | "row";

interface BookCardProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  variant?: BookCardVariant;
}

export function BookCard({
  asChild = false,
  className,
  variant = "surface",
  ...props
}: BookCardProps) {
  const Component = asChild ? Slot : "div";

  return (
    <Component
      className={cn("book-card", `book-card-${variant}`, className)}
      {...props}
    />
  );
}