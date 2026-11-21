"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#devices", label: "Every device" },
];

export function Nav({ ctaHref, signInHref }: { ctaHref: string; signInHref: string }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.1 }}
        className={`mx-3 mt-3 flex max-w-6xl items-center gap-4 rounded-2xl border px-3 py-2 transition-[background-color,border-color,box-shadow] duration-300 sm:mx-4 sm:px-4 xl:mx-auto ${
          scrolled ? "glass-overlay" : "border-transparent"
        }`}
      >
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:text-text">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href={signInHref} className="hidden rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:text-text sm:block">
            Sign in
          </Link>
          <span className="hidden sm:block">
            <Link href={ctaHref} className={buttonClass("primary", "sm")}>
              Start free
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-white/5 md:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="glass-overlay mx-3 mt-2 rounded-2xl p-2 md:hidden"
          >
            {links.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.04 * i } }}
                className="flex min-h-12 items-center rounded-xl px-4 text-text hover:bg-white/5"
              >
                {l.label}
              </motion.a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Link href={signInHref} className={buttonClass("secondary", "md")}>
                Sign in
              </Link>
              <Link href={ctaHref} className={buttonClass("primary", "md")}>
                Start free
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
