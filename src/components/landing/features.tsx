"use client";

import { motion, useInView } from "motion/react";
import { Cloud, FileUp, Laptop, Search, Smartphone, Star, Tablet } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { TypeBadge } from "@/components/ui/type-meta";
import { Reveal } from "./reveal";

function Tile({ className = "", children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-[20px] p-6 sm:p-7">
        {children}
      </div>
    </Reveal>
  );
}

function TileText({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative z-[3] mt-auto pt-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] text-muted">{body}</p>
    </div>
  );
}

function PreviewVisual() {
  return (
    <div className="relative z-[3] grid grid-cols-3 gap-3">
      {(["video", "doc", "article"] as const).map((t, i) => (
        <motion.div
          key={t}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
          className="overflow-hidden rounded-2xl border border-line bg-white/[0.03] transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1"
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <div
            className="aspect-[4/3]"
            style={{
              background: `radial-gradient(120% 100% at 0% 0%, var(--type-${t}), transparent 65%), linear-gradient(135deg, #161a22, #0a0c10)`,
              opacity: 0.35,
            }}
          />
          <div className="space-y-1.5 p-2.5">
            <TypeBadge type={t} className="!px-2 !py-0.5 !text-[10px]" />
            <div className="h-2 w-4/5 rounded bg-white/15" />
            <div className="h-2 w-1/2 rounded bg-white/[0.08]" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CollectionsVisual() {
  const cols = [
    { n: "Learning", c: "#C8F560", k: 24 },
    { n: "Watch later", c: "#FF7A6B", k: 12 },
    { n: "Design", c: "#B9A6FF", k: 31 },
  ];
  return (
    <div className="relative z-[3] space-y-2">
      {cols.map((c, i) => (
        <motion.div
          key={c.n}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.1 }}
          className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm"
        >
          <span className="size-2.5 rounded-full" style={{ background: c.c }} />
          <span className="flex-1">{c.n}</span>
          <span className="text-xs text-subtle">{c.k}</span>
        </motion.div>
      ))}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {["#tutorial", "#ai", "#recipes", "#research"].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-muted"
          >
            {t}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

const SEARCH_ITEMS = ["React hooks deep dive", "Figma auto-layout guide", "Neural networks, visually", "Sourdough starter basics", "Postgres indexing tips"];

function SearchVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const q = "neur";
  return (
    <div ref={ref} className="relative z-[3]">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.06] px-3">
        <Search className="size-4 text-muted" aria-hidden />
        <span className="font-mono text-sm">
          {inView &&
            q.split("").map((ch, i) => (
              <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.12 }}>
                {ch}
              </motion.span>
            ))}
        </span>
        <kbd className="ml-auto rounded-md border border-line px-1.5 text-[11px] text-subtle">⌘K</kbd>
      </div>
      <div className="mt-2 space-y-1">
        {SEARCH_ITEMS.map((s) => {
          const hit = s.toLowerCase().includes(q);
          return (
            <motion.div
              key={s}
              animate={inView ? { opacity: hit ? 1 : 0.22, x: hit ? 4 : 0 } : { opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className={`rounded-lg px-3 py-1.5 text-sm ${hit ? "bg-white/10 text-text" : "text-muted"}`}
            >
              {s}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SyncVisual() {
  const devices = [Smartphone, Laptop, Tablet];
  return (
    <div className="relative z-[3] flex items-center justify-between px-2 py-4">
      {devices.map((D, i) => (
        <div key={i} className="contents">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.12 }}
            className="grid size-14 place-items-center rounded-2xl border border-line bg-white/[0.04]"
          >
            <D className="size-6 text-text" aria-hidden />
          </motion.div>
          {i < devices.length - 1 && (
            <div className="relative mx-2 h-px flex-1 overflow-hidden bg-line">
              <motion.span
                className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/50"
                animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
              />
            </div>
          )}
        </div>
      ))}
      <Cloud className="absolute left-1/2 top-0 size-5 -translate-x-1/2 -translate-y-1 text-muted" aria-hidden />
    </div>
  );
}

function FavoriteVisual() {
  const [on, setOn] = useState(true);
  return (
    <div className="relative z-[3] flex items-center gap-4">
      <button
        type="button"
        onClick={() => setOn((o) => !o)}
        aria-pressed={on}
        aria-label="Try the favorite button"
        className="relative grid size-16 shrink-0 place-items-center rounded-2xl border border-line bg-white/[0.04] transition-colors hover:border-[#FFD166]/40"
      >
        <motion.span key={String(on)} initial={{ scale: 0.3, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 12 }}>
          <Star className={`size-7 ${on ? "fill-[#FFD166] text-[#FFD166]" : "text-muted"}`} aria-hidden />
        </motion.span>
        {on &&
          Array.from({ length: 6 }, (_, k) => (
            <motion.span
              key={`${k}-${String(on)}`}
              aria-hidden
              className="absolute size-1.5 rounded-full bg-[#FFD166]"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos((k / 6) * Math.PI * 2) * 30, y: Math.sin((k / 6) * Math.PI * 2) * 30, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
      </button>
      <div className="flex-1 rounded-2xl border border-line bg-white/[0.03] p-3 text-sm text-muted">
        <span className="font-medium text-text">Note: </span>
        Skip to 12:40 for the part about color contrast.
      </div>
    </div>
  );
}

function ImportVisual() {
  return (
    <div className="relative z-[3] flex items-center gap-3">
      <div className="grid size-14 place-items-center rounded-2xl border border-line bg-white/[0.04]">
        <FileUp className="size-6 text-muted" aria-hidden />
      </div>
      <div className="relative h-px flex-1 bg-line">
        {Array.from({ length: 3 }, (_, k) => (
          <motion.span
            key={k}
            className="absolute -top-1 size-2 rounded-full bg-white/50"
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="grid size-14 place-items-center rounded-2xl bg-lime text-on-lime">
        <span className="font-display text-lg font-bold">S</span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-6">
      <Tile className="md:col-span-4">
        <PreviewVisual />
        <TileText
          title="Beautiful previews, automatically"
          body="Paste a link and Stash pulls in the title, thumbnail and site icon, then sorts it as a video, doc or article without you lifting a finger."
        />
      </Tile>
      <Tile className="md:col-span-2" delay={0.08}>
        <CollectionsVisual />
        <TileText title="Collections & tags" body="Group links your way. Tag once, filter forever." />
      </Tile>
      <Tile className="md:col-span-2">
        <SearchVisual />
        <TileText title="Find anything in a keystroke" body="Search titles, notes, tags and sites instantly. Press ⌘K or / from anywhere." />
      </Tile>
      <Tile className="md:col-span-2" delay={0.08}>
        <SyncVisual />
        <TileText title="Synced everywhere" body="Save on your phone, open on your laptop. Changes appear live on every device." />
      </Tile>
      <Tile className="md:col-span-2" delay={0.16}>
        <FavoriteVisual />
        <TileText title="Favorites & notes" body="Star what matters, jot why it matters, and tick things off once watched or read." />
      </Tile>
      <Tile className="md:col-span-6">
        <div className="relative z-[3] grid items-center gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold">Bring your bookmarks with you</h3>
            <p className="mt-2 max-w-md text-[15px] text-muted">
              Import a bookmarks file from Chrome, Safari, Firefox or Edge in one click. Export everything as JSON whenever you
              like. Your links are always yours.
            </p>
          </div>
          <ImportVisual />
        </div>
      </Tile>
    </div>
  );
}
