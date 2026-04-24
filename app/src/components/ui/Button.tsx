import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition duration-200 focus:outline-none focus:ring-4 focus:ring-sea-200/70 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-ink text-white shadow-glow hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lift",
        variant === "secondary" &&
          "border border-slate-200/90 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-sea-200 hover:bg-sea-50/80 hover:text-sea-800",
        variant === "ghost" && "text-slate-600 shadow-none hover:bg-slate-100/90 hover:text-ink",
        variant === "danger" && "bg-rose-600 text-white hover:-translate-y-0.5 hover:bg-rose-700",
        className,
      )}
      {...props}
    />
  );
}
