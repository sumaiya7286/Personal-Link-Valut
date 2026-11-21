"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
}

type ToastInput = Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"]; duration?: number };

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    ({ duration, tone = "success", ...t }: ToastInput) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...t, tone, id }]);
      window.setTimeout(() => dismiss(id), duration ?? (t.action ? 6000 : 3200));
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-safe z-[70] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.16 } }}
              role="status"
              className="glass-overlay pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl py-2.5 pl-4 pr-2 text-sm"
            >
              {t.tone === "error" ? (
                <AlertCircle className="size-4.5 shrink-0 text-danger" aria-hidden />
              ) : (
                <CheckCircle2 className="size-4.5 shrink-0 text-lime" aria-hidden />
              )}
              <span className="min-w-0 flex-1 text-text">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="min-h-9 rounded-xl px-3 font-medium text-lime transition-colors hover:bg-white/5"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="grid size-9 place-items-center rounded-xl text-subtle transition-colors hover:bg-white/5 hover:text-text"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx>
  );
}
