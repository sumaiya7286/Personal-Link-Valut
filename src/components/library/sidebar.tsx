"use client";

import { motion } from "motion/react";
import { CircleDashed, Hash, Layers, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Menu } from "@/components/ui/menu";
import type { Collection, ViewFilter } from "@/lib/types";

export interface SidebarCounts {
  all: number;
  favorites: number;
  unread: number;
  byCollection: Record<string, number>;
}

interface Props {
  view: ViewFilter;
  onView: (v: ViewFilter) => void;
  counts: SidebarCounts;
  collections: Collection[];
  tags: [string, number][];
  activeTag: string | null;
  onTag: (t: string | null) => void;
  onNewCollection: () => void;
  onEditCollection: (c: Collection) => void;
  onDeleteCollection: (c: Collection) => void;
  layoutGroup: string;
}

const same = (a: ViewFilter, b: ViewFilter) =>
  a.kind === b.kind && (a.kind !== "collection" || (b.kind === "collection" && a.id === b.id));

function NavItem({
  active,
  onClick,
  icon,
  label,
  count,
  layoutGroup,
  hasMenu,
}: {
  hasMenu?: boolean;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  layoutGroup: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] transition-colors ${
        hasMenu ? "pr-11 [@media(hover:hover)]:pr-3" : ""
      } ${
        active ? "text-text" : "text-muted hover:bg-white/[0.04] hover:text-text"
      }`}
    >
      {active && (
        <motion.span
          layoutId={`${layoutGroup}-nav-active`}
          className="absolute inset-0 rounded-xl border border-line-strong bg-white/[0.07]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        >
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-lime shadow-[0_0_12px_var(--lime)]" />
        </motion.span>
      )}
      <span className="relative grid size-5 place-items-center">{icon}</span>
      <span className="relative flex-1 truncate">{label}</span>
      {count !== undefined && <span className="relative text-xs tabular-nums text-subtle">{count}</span>}
    </button>
  );
}

export function Sidebar({
  view,
  onView,
  counts,
  collections,
  tags,
  activeTag,
  onTag,
  onNewCollection,
  onEditCollection,
  onDeleteCollection,
  layoutGroup,
}: Props) {
  return (
    <nav aria-label="Library" className="flex flex-col gap-6">
      <div className="space-y-0.5">
        <NavItem
          layoutGroup={layoutGroup}
          active={same(view, { kind: "all" })}
          onClick={() => onView({ kind: "all" })}
          icon={<Layers className="size-[18px]" aria-hidden />}
          label="All links"
          count={counts.all}
        />
        <NavItem
          layoutGroup={layoutGroup}
          active={same(view, { kind: "favorites" })}
          onClick={() => onView({ kind: "favorites" })}
          icon={<Star className="size-[18px]" aria-hidden />}
          label="Favorites"
          count={counts.favorites}
        />
        <NavItem
          layoutGroup={layoutGroup}
          active={same(view, { kind: "unread" })}
          onClick={() => onView({ kind: "unread" })}
          icon={<CircleDashed className="size-[18px]" aria-hidden />}
          label="To watch & read"
          count={counts.unread}
        />
      </div>

      <section aria-labelledby={`${layoutGroup}-col-h`}>
        <div className="mb-1.5 flex items-center justify-between pl-3">
          <h2 id={`${layoutGroup}-col-h`} className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
            Collections
          </h2>
          <button
            type="button"
            onClick={onNewCollection}
            aria-label="New collection"
            className="grid size-9 place-items-center rounded-lg text-subtle transition-colors hover:bg-white/[0.06] hover:text-lime"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        {collections.length === 0 ? (
          <button
            type="button"
            onClick={onNewCollection}
            className="w-full rounded-xl border border-dashed border-line px-3 py-3 text-left text-sm text-subtle transition-colors hover:border-lime/40 hover:text-muted"
          >
            Group links into collections like “Work” or “Tutorials”.
          </button>
        ) : (
          <ul className="space-y-0.5">
            {collections.map((c) => (
              <li key={c.id} className="group/col relative">
                <NavItem
                  hasMenu
                  layoutGroup={layoutGroup}
                  active={same(view, { kind: "collection", id: c.id })}
                  onClick={() => onView({ kind: "collection", id: c.id })}
                  icon={
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }}
                      aria-hidden
                    />
                  }
                  label={c.name}
                  count={counts.byCollection[c.id] ?? 0}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/col:opacity-100 [@media(hover:hover)]:has-[[aria-expanded=true]]:opacity-100 [@media(hover:hover)]:focus-within:opacity-100">
                  <Menu
                    items={[
                      { label: "Rename", icon: Pencil, onSelect: () => onEditCollection(c) },
                      { label: "Delete collection", icon: Trash2, danger: true, onSelect: () => onDeleteCollection(c) },
                    ]}
                    trigger={(p) => (
                      <button
                        {...p}
                        type="button"
                        aria-label={`Options for ${c.name}`}
                        className="grid size-8 place-items-center rounded-lg bg-ink-900 text-subtle hover:text-text"
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </button>
                    )}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tags.length > 0 && (
        <section aria-labelledby={`${layoutGroup}-tag-h`}>
          <h2
            id={`${layoutGroup}-tag-h`}
            className="mb-2.5 pl-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-subtle"
          >
            Tags
          </h2>
          <div className="flex flex-wrap gap-1.5 px-1">
            {tags.slice(0, 24).map(([t, n]) => {
              const active = activeTag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTag(active ? null : t)}
                  aria-pressed={active}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors ${
                    active
                      ? "border-lime/50 bg-lime/15 text-lime"
                      : "border-line text-muted hover:border-line-strong hover:text-text"
                  }`}
                >
                  <Hash className="size-3" aria-hidden />
                  {t}
                  <span className="text-subtle">{n}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </nav>
  );
}
