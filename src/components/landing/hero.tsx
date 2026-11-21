"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, Check, NotebookPen, Star } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { TypeBadge } from "@/components/ui/type-meta";
import type { LinkItem } from "@/lib/types";

const base: Omit<LinkItem, "id" | "url" | "title" | "type"> = {
  description: null,
  image_url: null,
  favicon_url: null,
  site_name: null,
  collection_id: null,
  tags: [],
  notes: null,
  is_favorite: false,
  is_done: false,
  created_at: "",
  updated_at: "",
};

const demoCards: (LinkItem & { pos: string; rot: number; depth: number; delay: number })[] = [
  {
    ...base,
    id: "h1",
    url: "https://react.dev/learn",
    title: "Quick Start – React",
    type: "doc",
    tags: ["frontend"],
    pos: "left-[2%] top-[14%] sm:left-[4%]",
    rot: -9,
    depth: 18,
    delay: 0.55,
  },
  {
    ...base,
    id: "h2",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
    title: "But what is a neural network?",
    type: "video",
    tags: ["ai", "watch-later"],
    is_favorite: true,
    pos: "left-[calc(50%-min(8.5rem,31vw))] top-0 z-10",
    rot: 0,
    depth: 34,
    delay: 0.4,
  },
  {
    ...base,
    id: "h3",
    url: "https://paulgraham.com/greatwork.html",
    title: "How to Do Great Work",
    type: "article",
    notes: "Re-read the part on curiosity.",
    is_done: true,
    pos: "right-[2%] top-[20%] sm:right-[4%]",
    rot: 8,
    depth: 22,
    delay: 0.7,
  },
];

function FloatingCard({
  card,
  mx,
  my,
}: {
  card: (typeof demoCards)[number];
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const x = useTransform(mx, (v) => v * card.depth);
  const y = useTransform(my, (v) => v * card.depth);
  return (
    <motion.div className={`absolute w-[min(17rem,62vw)] ${card.pos}`} style={{ x, y }}>
      <motion.div
        initial={{ opacity: 0, y: 60, rotate: card.rot * 2, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, rotate: card.rot, scale: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 16, delay: card.delay }}
      >
        <div className="animate-float" style={{ animationDelay: `${card.delay * -4}s` }}>
          <div className="glass-overlay group overflow-hidden rounded-[20px]">
            <div className="relative">
              <Cover link={card} className="aspect-[16/9] w-full" />
              <div className="absolute left-3 top-3">
                <TypeBadge type={card.type} />
              </div>
            </div>
            <div className="space-y-2.5 p-4">
              <p className="line-clamp-1 font-display font-semibold">{card.title}</p>
              {card.notes && (
                <p className="flex items-center gap-2 text-xs text-muted">
                  <NotebookPen className="size-3.5 text-muted" aria-hidden /> {card.notes}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                {card.tags.map((t) => (
                  <span key={t} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted">
                    #{t}
                  </span>
                ))}
                <span className="ml-auto flex items-center gap-1 text-subtle">
                  {card.is_done && <Check className="size-4 text-text" aria-hidden strokeWidth={3} />}
                  {card.is_favorite && <Star className="size-4 fill-[#FFD166] text-[#FFD166]" aria-hidden />}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const words = ["Every", "link", "worth", "keeping."];

export function Hero({ ctaHref }: { ctaHref: string }) {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  return (
    <section
      className="relative px-5 pb-10 pt-32 sm:pt-40"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        rawX.set((e.clientX / window.innerWidth - 0.5) * 0.6);
        rawY.set((e.clientY / window.innerHeight - 0.5) * 0.6);
      }}
    >
      <div className="mx-auto max-w-5xl text-center">
        <motion.a
          href="#how"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass group inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm text-muted transition-colors hover:border-white/20 hover:text-text"
        >
          <span className="rounded-full bg-white/12 px-2 py-0.5 text-xs font-semibold text-text">New</span>
          <span className="sm:hidden">Instant link previews</span>
          <span className="hidden sm:inline">Paste a link — previews appear instantly</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </motion.a>

        <h1 className="mx-auto mt-7 max-w-4xl text-[clamp(2.75rem,8.5vw,6.25rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
          <span className="sr-only">Every link worth keeping. Kept beautifully.</span>
          <span aria-hidden className="block">
            {words.map((w, i) => (
              <motion.span
                key={w}
                className="mr-[0.22em] inline-block"
                initial={{ opacity: 0, y: "0.5em", filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.08 }}
              >
                {w}
              </motion.span>
            ))}
          </span>
          <motion.span
            aria-hidden
            className="block pb-2"
            initial={{ opacity: 0, y: "0.4em", filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          >
            Kept beautifully.
          </motion.span>
        </h1>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg text-muted sm:text-xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Stash is a calm home for the videos, docs and articles you mean to come back to — organized, searchable and
          synced on every device.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6 }}
        >
          <Link href={ctaHref} className={buttonClass("primary", "lg", "group w-full sm:w-auto")}>
            Start your stash — it&apos;s free
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
          <a href="#how" className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
            See how it works
          </a>
        </motion.div>
      </div>

      <div aria-hidden className="relative mx-auto mt-16 h-[22rem] max-w-5xl sm:mt-20 sm:h-[26rem]">
        {demoCards.map((c) => (
          <FloatingCard key={c.id} card={c} mx={mx} my={my} />
        ))}
      </div>
    </section>
  );
}
