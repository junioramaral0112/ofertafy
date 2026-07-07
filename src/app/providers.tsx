"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <MotionConfig transition={{ type: "spring", stiffness: 260, damping: 25 }}>
        {children}
      </MotionConfig>
    </NextThemesProvider>
  );
}
