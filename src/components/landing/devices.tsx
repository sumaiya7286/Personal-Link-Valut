"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const tiles = [
  { t: "video", w: "w-4/5" },
  { t: "doc", w: "w-3/5" },
  { t: "article", w: "w-2/3" },
  { t: "doc", w: "w-1/2" },
  { t: "video", w: "w-3/4" },
  { t: "other", w: "w-2/5" },
] as const;

function MiniTile({ t, w }: { t: string; w: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03]">
      <div
        className="aspect-[16/9]"
        style={{ background: `radial-gradient(120% 100% at 0% 0%, var(--type-${t}), transparent 65%), #10131a`, opacity: 0.35 }}
      />
      <div className="space-y-1 p-1.5">
        <div className={`h-1.5 rounded bg-white/20 ${w}`} />
        <div className="h-1 w-1/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

/** Laptop + phone mockups that drift apart as you scroll: the same library on every screen. */
export function Devices() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [80, -60]);
  const laptopY = useTransform(scrollYProgress, [0, 1], [30, -20]);

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl pb-10" aria-hidden>
      <motion.div style={{ y: laptopY }} className="mx-auto w-[92%] sm:w-[82%]">
        <div className="glass rounded-b-none rounded-t-[20px] p-2.5 sm:p-3">
          <div className="flex overflow-hidden rounded-xl bg-ink-950">
            <div className="hidden w-1/5 space-y-2 border-r border-white/[0.06] p-3 sm:block">
              <div className="h-3 w-3/4 rounded bg-lime/70" />
              {[0, 1, 2, 3, 4].map((k) => (
                <div key={k} className={`h-2 rounded ${k === 0 ? "w-full bg-white/20" : "w-2/3 bg-white/[0.08]"}`} />
              ))}
            </div>
            <div className="flex-1 p-3">
              <div className="mb-3 h-5 w-1/2 rounded-md border border-white/[0.06] bg-white/[0.03]" />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[...tiles, ...tiles.slice(0, 2)].map((x, k) => (
                  <MiniTile key={k} {...x} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-3 w-[104%] -translate-x-[2%] rounded-b-2xl bg-gradient-to-b from-[#2a2f3a] to-[#14171d]" />
      </motion.div>

      <motion.div
        style={{ y: phoneY }}
        className="glass-overlay absolute -bottom-4 right-[2%] w-[30%] max-w-[180px] rounded-[20px] p-1.5 sm:right-[6%]"
      >
        <div className="overflow-hidden rounded-[14px] bg-ink-950 p-2">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/10" />
          <div className="mb-2 h-4 rounded-md border border-white/[0.06] bg-white/[0.03]" />
          <div className="space-y-2">
            {tiles.slice(0, 3).map((x, k) => (
              <MiniTile key={k} {...x} />
            ))}
          </div>
          <div className="ml-auto mt-2 size-6 rounded-lg bg-lime" />
        </div>
      </motion.div>
    </div>
  );
}
