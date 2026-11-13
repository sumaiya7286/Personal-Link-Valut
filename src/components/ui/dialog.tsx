"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIsMobile, useMounted } from "@/lib/hooks";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Centered modal on desktop, draggable bottom sheet on phones. Traps focus and restores it on close. */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const drag = useDragControls();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const width = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-xl";

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            className={`glass relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-ink-900/90 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.9)] sm:rounded-[28px] ${width}`}
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.94, y: 16 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              isMobile
                ? { y: "100%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
                : { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }
            }
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            drag={isMobile ? "y" : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent" />
            {isMobile && (
              <div
                className="flex touch-none justify-center pb-1 pt-3"
                onPointerDown={(e) => drag.start(e)}
                aria-hidden
              >
                <div className="h-1.5 w-11 rounded-full bg-white/20" />
              </div>
            )}
            <header
              className="flex items-start gap-4 px-5 pb-2 pt-3 sm:px-7 sm:pt-6"
              onPointerDown={isMobile ? (e) => drag.start(e) : undefined}
            >
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-xl font-semibold sm:text-2xl">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>
            <div className="thin-scroll flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2 sm:px-7">{children}</div>
            {footer && (
              <footer className="pb-safe flex items-center justify-end gap-2 border-t border-line bg-ink-950/40 px-5 pt-4 sm:px-7 sm:pb-5">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
