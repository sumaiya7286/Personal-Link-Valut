"use client";

import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/hooks";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  hint?: string;
}

interface MenuProps {
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: (e: React.MouseEvent) => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    "aria-controls": string;
  }) => ReactNode;
  items: (MenuItem | "separator")[];
  align?: "start" | "end";
  /** Preferred side; flips automatically when there isn't room. */
  side?: "top" | "bottom";
  header?: ReactNode;
}

const GAP = 8;
const EST_HEIGHT = 300;

/**
 * Accessible dropdown rendered in a portal with fixed positioning, so it is never
 * clipped by cards or scroll containers. Arrow keys, Escape, outside click, closes on scroll.
 */
export function Menu({ trigger, items, align = "end", side = "bottom", header }: MenuProps) {
  const [pos, setPos] = useState<{ style: CSSProperties; up: boolean } | null>(null);
  const open = pos !== null;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const mounted = useMounted();

  const close = (refocus = false) => {
    setPos(null);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) return close();
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = side === "top" ? r.top > EST_HEIGHT || r.top > below : below < EST_HEIGHT && r.top > below;
    const style: CSSProperties = {
      ...(up ? { bottom: window.innerHeight - r.top + GAP } : { top: r.bottom + GAP }),
      ...(align === "end"
        ? { right: Math.max(8, window.innerWidth - r.right) }
        : { left: Math.min(Math.max(8, r.left), window.innerWidth - 224) }),
      maxHeight: (up ? r.top : below) - GAP * 2,
    };
    setPos({ style, up });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setPos(null);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setPos(null);
    };
    const onResize = () => setPos(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    const t = window.setTimeout(
      () => menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus({ preventScroll: true }),
      20,
    );
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    const focus = (n?: HTMLElement) => n?.focus({ preventScroll: false });
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focus(nodes[(i + 1) % nodes.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focus(nodes[(i - 1 + nodes.length) % nodes.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      focus(nodes[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      focus(nodes[nodes.length - 1]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      close(true);
    }
  };

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: toggle,
        "aria-expanded": open,
        "aria-haspopup": "menu",
        "aria-controls": id,
      })}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {pos && (
              <motion.div
                ref={menuRef}
                id={id}
                role="menu"
                onKeyDown={onMenuKey}
                initial={{ opacity: 0, scale: 0.95, y: pos.up ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                style={{ ...pos.style, transformOrigin: `${pos.up ? "bottom" : "top"} ${align === "end" ? "right" : "left"}` }}
                className="glass-overlay thin-scroll fixed z-[65] w-max min-w-52 max-w-[calc(100vw-16px)] overflow-y-auto rounded-2xl p-1.5"
              >
                {header}
                {items.map((item, i) =>
                  item === "separator" ? (
                    <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-white/10" />
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        close(true);
                        item.onSelect();
                      }}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm outline-none transition-colors focus-visible:bg-white/[0.07] focus-visible:outline-none ${
                        item.danger ? "text-danger hover:bg-danger/10" : "text-text hover:bg-white/[0.06]"
                      }`}
                    >
                      {item.icon ? (
                        <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                      ) : (
                        <span className="size-4 shrink-0" aria-hidden />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.hint && <span className="text-xs text-subtle">{item.hint}</span>}
                    </button>
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
