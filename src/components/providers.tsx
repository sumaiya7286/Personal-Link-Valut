"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { ToastProvider } from "./ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 32 }}>
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
