"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "premium" | "glass";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95";

    const variantStyles = {
      primary:
        "bg-brand-purple hover:bg-[#4338CA] text-white shadow-md hover:shadow-lg hover:shadow-brand-purple/20 focus:ring-brand-purple",
      secondary:
        "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700/80 border border-slate-300/40 dark:border-slate-700/50",
      premium:
        "bg-gradient-to-r from-brand-purple via-brand-orange to-brand-shopee hover:opacity-95 text-white shadow-neon-glow hover:shadow-cyber-glow",
      glass:
        "glass-container-light dark:glass-container-dark text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-900/60"
    };

    const sizeStyles = {
      sm: "px-4 py-1.5 text-xs",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base"
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...(props as any)}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {variant === "premium" && (
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full hover:animate-[marquee_2s_ease-in-out_infinite]" />
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };
