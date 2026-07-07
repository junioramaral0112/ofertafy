import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  className?: string;
  variant?: "brand" | "orange" | "shopee" | "cyan" | "emerald" | "outline";
  children: React.ReactNode;
}

export function Badge({ className, variant = "brand", children }: BadgeProps) {
  const variantStyles = {
    brand: "bg-brand-purple/10 text-brand-purple dark:text-brand-purple/90 border-brand-purple/20",
    orange: "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
    shopee: "bg-brand-shopee/10 text-brand-shopee border-brand-shopee/20",
    cyan: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20",
    emerald: "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20",
    outline: "bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border tracking-wide select-none backdrop-blur-sm",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
