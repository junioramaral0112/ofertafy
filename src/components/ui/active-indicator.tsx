import React from "react";
import { cn } from "@/lib/utils";

interface ActiveIndicatorProps {
  className?: string;
  text?: string;
}

export function ActiveIndicator({ className, text = "Monitoramento ao Vivo" }: ActiveIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-container-light dark:glass-container-dark text-xs font-medium text-slate-700 dark:text-slate-300", className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald" />
      </span>
      <span>{text}</span>
    </div>
  );
}
