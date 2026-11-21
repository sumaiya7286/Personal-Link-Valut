"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Link2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TypeBadge } from "@/components/ui/type-meta";

const DEMOS = [
  {
    url: "youtube.com/watch?v=design-systems-talk",
    title: "Design Systems at Scale — Conference Talk",
    site: "YouTube",
    type: "video" as const,
    tags: ["design", "talks"],
    hue: 8,
  },
  {
    url: "docs.google.com/document/d/q3-roadmap",
    title: "Q3 Product Roadmap",
    site: "Google Docs",
    type: "doc" as const,
    tags: ["work", "planning"],
    hue: 212,
  },
  {
    url: "medium.com/@writer/the-art-of-focus",
    title: "The Art of Deep Focus in a Noisy World",
    site: "Medium",
    type: "article" as const,
    tags: ["reading", "focus"],
    hue: 90,
  },
];

type Phase = "typing" | "fetching" | "saved";

/** Looping "paste → saved" product moment. Pauses off-screen; shows the final state under reduced motion. */
export function PasteDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const demo = DEMOS[i];

  useEffect(() => {
    if (reduce || !inView) return;
    let t: number;
    if (phase === "typing") {
      if (chars < demo.url.length) t = window.setTimeout(() => setChars((c) => c + 1), 38);
      else t = window.setTimeout(() => setPhase("fetching"), 350);
    } else if (phase === "fetching") {
      t = window.setTimeout(() => setPhase("saved"), 900);
    } else {
      t = window.setTimeout(() => {
        setI((n) => (n + 1) % DEMOS.length);
        setChars(0);
        setPhase("typing");
      }, 2800);
    }
    return () => window.clearTimeout(t);
  }, [phase, chars, demo.url.length, inView, reduce]);

  const shownChars = reduce ? demo.url.length : chars;
  const shownPhase: Phase = reduce ? "saved" : phase;

  return (
    <div ref={ref} className="glass relative mx-auto w-full max-w-xl overflow-hidden rounded-[20px] p-4 sm:p-6">
      <div className="flex h-13 items-center gap-3 rounded-2xl border border-line bg-white/[0.03] px-4">
        <Link2 className="size-[18px] shrink-0 text-subtle" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-text">
          https://{demo.url.slice(0, shownChars)}
          {shownPhase === "typing" && <span className="ml-px inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-white/70" />}
        </span>
        {shownPhase === "fetching" && <Loader2 className="size-[18px] animate-spin text-muted" aria-hidden />}
        {shownPhase === "saved" && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-muted">
            <Sparkles className="size-[18px]" aria-hidden />
          </motion.span>
        )}
      </div>

      <div className="relative mt-4 h-[7.5rem] sm:h-32">
        <AnimatePresence mode="wait">
          {shownPhase === "fetching" && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 flex gap-4 rounded-2xl border border-line p-3"
            >
              <div className="skeleton h-full w-32 rounded-xl sm:w-40" />
              <div className="flex-1 space-y-2.5 py-1.5">
                <div className="skeleton h-4 w-4/5 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </motion.div>
          )}
          {shownPhase === "saved" && (
            <motion.div
              key={`card-${i}`}
              initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="absolute inset-0 flex gap-4 rounded-2xl border border-line-strong bg-white/[0.03] p-3"
            >
              <div
                className="relative h-full w-32 shrink-0 overflow-hidden rounded-xl sm:w-40"
                style={{
                  background: `radial-gradient(120% 100% at 0% 0%, hsl(${demo.hue} 20% 30%), transparent 60%), linear-gradient(135deg, hsl(${demo.hue} 12% 16%), #0a0c10)`,
                }}
              >
                <div className="grid-bg absolute inset-0" />
              </div>
              <div className="min-w-0 flex-1 py-1">
                <TypeBadge type={demo.type} />
                <p className="mt-2 line-clamp-2 font-display text-[15px] font-semibold leading-snug">{demo.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-subtle">{demo.site}</span>
                  {demo.tags.map((t, k) => (
                    <motion.span
                      key={t}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + k * 0.1, type: "spring", stiffness: 500, damping: 20 }}
                      className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-text"
                    >
                      #{t}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
