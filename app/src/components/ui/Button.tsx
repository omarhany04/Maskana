import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition duration-200 focus:outline-none focus:ring-4 focus:ring-sea-200/60 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "shimmer bg-ink text-white shadow-glow hover:-translate-y-0.5 hover:bg-slate-950 hover:shadow-lift",
        variant === "secondary" &&
          "border border-slate-200/90 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-sea-200 hover:bg-sea-50/90 hover:text-sea-800 hover:shadow-crisp",
        variant === "ghost" && "text-slate-600 shadow-none hover:bg-slate-100/90 hover:text-ink",
        variant === "danger" && "bg-rose-600 text-white hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lift",
        variant === "success" && "bg-emerald-600 text-white hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}
