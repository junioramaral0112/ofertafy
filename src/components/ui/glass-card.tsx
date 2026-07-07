"use client";

import React, { useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "purple" | "orange" | "cyan" | "emerald" | "default";
}

export function GlassCard({ children, className, glowColor = "default" }: GlassCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const glowStyles = {
    default: "rgba(124, 58, 237, 0.08)", // Purple
    purple: "rgba(79, 70, 229, 0.12)",
    orange: "rgba(249, 115, 22, 0.12)",
    cyan: "rgba(6, 182, 212, 0.12)",
    emerald: "rgba(16, 185, 129, 0.12)",
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-3xl transition-shadow duration-500 overflow-hidden",
        "glass-container-light dark:glass-container-dark hover:shadow-glass-lg",
        className
      )}
    >
      {/* Spotlight Effect (Radial glow pointing at mouse cursor) */}
      <motion.div
        className="absolute -inset-px rounded-3xl pointer-events-none opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              ${glowStyles[glowColor]},
              transparent 80%
            )
          `,
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
