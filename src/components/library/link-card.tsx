"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, FolderInput, MoreHorizontal, NotebookPen, Pencil, Star, Trash2 } from "lucide-react";
import { memo, useCallback, type PointerEvent } from "react";
import { Cover, Favicon } from "@/components/ui/cover";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { TypeBadge } from "@/components/ui/type-meta";
import type { Collection, LinkItem } from "@/lib/types";
import { getDomain } from "@/lib/url";

export interface CardActions {
  onToggleFavorite: (l: LinkItem) => void;
  onToggleDone: (l: LinkItem) => void;
  onEdit: (l: LinkItem) => void;
  onDelete: (l: LinkItem) => void;
  onCopy: (l: LinkItem) => void;
  onMove: (l: LinkItem, collectionId: string | null) => void;
  onTagClick: (tag: string) => void;
}

const relTime = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const doneLabel = (l: LinkItem) => (l.type === "video" ? "Watched" : "Read");

function FavoriteButton({ link, onToggle }: { link: LinkItem; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={link.is_favorite}
      aria-label={link.is_favorite ? "Remove from favorites" : "Add to favorites"}
      className="relative grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.07] hover:text-text"
    >
      <motion.span
        key={String(link.is_favorite)}
        initial={link.is_favorite ? { scale: 0.4, rotate: -40 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 14 }}
        className="grid place-items-center"
      >
        <Star
          className={`size-[18px] ${link.is_favorite ? "fill-[#FFD166] text-[#FFD166]" : ""}`}
          aria-hidden
        />
      </motion.span>
      <AnimatePresence>
        {link.is_favorite && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-1 rounded-full border-2 border-[#FFD166]"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

function useCardMenu(link: LinkItem, collections: Collection[], a: CardActions): (MenuItem | "separator")[] {
  return [
    { label: "Edit details", icon: Pencil, onSelect: () => a.onEdit(link) },
    { label: "Copy link", icon: Copy, onSelect: () => a.onCopy(link) },
    {
      label: link.is_done ? `Mark as not ${doneLabel(link).toLowerCase()}` : `Mark as ${doneLabel(link).toLowerCase()}`,
      icon: Check,
      onSelect: () => a.onToggleDone(link),
    },
    "separator",
    ...collections
      .filter((c) => c.id !== link.collection_id)
      .slice(0, 6)
      .map((c) => ({ label: `Move to ${c.name}`, icon: FolderInput, onSelect: () => a.onMove(link, c.id) })),
    ...(link.collection_id
      ? [{ label: "Remove from collection", icon: FolderInput, onSelect: () => a.onMove(link, null) }]
      : []),
    "separator",
    { label: "Delete", icon: Trash2, danger: true, onSelect: () => a.onDelete(link) },
  ];
}

function MoreMenu({ link, collections, actions }: { link: LinkItem; collections: Collection[]; actions: CardActions }) {
  const items = useCardMenu(link, collections, actions);
  return (
    <Menu
      items={items}
      trigger={(p) => (
        <button
          {...p}
          type="button"
          aria-label={`More actions for ${link.title || getDomain(link.url)}`}
          className="grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.07] hover:text-text"
        >
          <MoreHorizontal className="size-[18px]" aria-hidden />
        </button>
      )}
    />
  );
}

function useSpotlight() {
  return useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);
}

interface CardProps {
  link: LinkItem;
  collection?: Collection;
  collections: Collection[];
  actions: CardActions;
  index: number;
}

export const LinkCard = memo(function LinkCard({ link, collection, collections, actions, index }: CardProps) {
  const onMove = useSpotlight();
  const domain = getDomain(link.url);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 340, damping: 30, delay: Math.min(index, 12) * 0.035 }}
      onPointerMove={onMove}
      className="spotlight group flex flex-col overflow-hidden rounded-3xl border border-line bg-ink-900/70 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] hover:border-line-strong hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
    >
      <div className="relative">
        <Cover link={link} className={`aspect-[16/9] w-full ${link.is_done ? "opacity-50 grayscale-[60%]" : ""}`} />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[3] flex items-center justify-between gap-2">
          <TypeBadge type={link.type} />
          {link.is_done && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-text backdrop-blur-md">
              <Check className="size-3.5" aria-hidden /> {doneLabel(link)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pb-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg outline-none after:absolute after:inset-0 after:z-0 after:rounded-3xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-lime"
        >
          <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-snug text-text">
            {link.title || domain}
          </h3>
        </a>
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Favicon link={link} />
          <span className="truncate">{link.site_name && link.site_name !== domain ? `${link.site_name} · ${domain}` : domain}</span>
        </div>
        {link.description && <p className="line-clamp-2 text-sm text-subtle">{link.description}</p>}
        {link.notes && (
          <p className="flex gap-2 rounded-xl border border-line bg-white/[0.025] px-3 py-2 text-[13px] text-muted">
            <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-lime" aria-hidden />
            <span className="line-clamp-2">{link.notes}</span>
          </p>
        )}
        {(link.tags.length > 0 || collection) && (
          <div className="relative z-[3] flex flex-wrap gap-1.5">
            {collection && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-muted"
              >
                <span className="size-2 rounded-full" style={{ background: collection.color }} aria-hidden />
                {collection.name}
              </span>
            )}
            {link.tags.slice(0, 4).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => actions.onTagClick(t)}
                className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-muted transition-colors hover:bg-lime/15 hover:text-lime"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="relative z-[3] mt-auto flex items-center gap-1 px-2 pb-2">
        <span className="pl-2 text-xs text-subtle">{relTime(link.created_at)}</span>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => actions.onToggleDone(link)}
            aria-pressed={link.is_done}
            aria-label={link.is_done ? `Mark as not ${doneLabel(link).toLowerCase()}` : `Mark as ${doneLabel(link).toLowerCase()}`}
            className={`grid size-10 place-items-center rounded-xl transition-colors hover:bg-white/[0.07] ${
              link.is_done ? "text-lime" : "text-muted hover:text-text"
            }`}
          >
            <Check className="size-[18px]" aria-hidden strokeWidth={link.is_done ? 3 : 2} />
          </button>
          <FavoriteButton link={link} onToggle={() => actions.onToggleFavorite(link)} />
          <MoreMenu link={link} collections={collections} actions={actions} />
        </div>
      </footer>
    </motion.article>
  );
});

export const LinkRow = memo(function LinkRow({ link, collection, collections, actions, index }: CardProps) {
  const domain = getDomain(link.url);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32, delay: Math.min(index, 16) * 0.02 }}
      className="group relative flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-white/[0.03] sm:gap-4 sm:px-3"
    >
      <Cover link={link} className={`aspect-[16/10] w-20 shrink-0 rounded-xl sm:w-28 ${link.is_done ? "opacity-50" : ""}`} />
      <div className="min-w-0 flex-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-lime"
        >
          <h3 className="truncate font-display text-[15px] font-semibold text-text sm:text-base">{link.title || domain}</h3>
        </a>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-[13px] text-muted">
          <Favicon link={link} className="size-3.5" />
          <span className="truncate">{domain}</span>
          {collection && (
            <span className="hidden items-center gap-1.5 truncate sm:inline-flex">
              <span className="text-subtle">·</span>
              <span className="size-1.5 rounded-full" style={{ background: collection.color }} aria-hidden />
              {collection.name}
            </span>
          )}
          {link.tags.slice(0, 2).map((t) => (
            <span key={t} className="hidden text-subtle md:inline">
              #{t}
            </span>
          ))}
        </div>
      </div>
      <TypeBadge type={link.type} className="hidden lg:inline-flex" />
      <div className="relative z-[3] flex items-center">
        <FavoriteButton link={link} onToggle={() => actions.onToggleFavorite(link)} />
        <MoreMenu link={link} collections={collections} actions={actions} />
      </div>
    </motion.article>
  );
});
