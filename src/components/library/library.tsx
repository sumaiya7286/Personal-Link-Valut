"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  ArrowDownUp,
  Check,
  ClipboardPaste,
  LayoutGrid,
  List,
  Menu as MenuIcon,
  Plus,
  Search,
  SearchX,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Aurora } from "@/components/ui/aurora";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { Menu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { TYPE_META } from "@/components/ui/type-meta";
import { SORT_LABELS, applyQuery, matchesView } from "@/lib/filter";
import { useIsMac } from "@/lib/hooks";
import { exportJson, parseImport } from "@/lib/io";
import type { LibraryStore } from "@/lib/store/types";
import { LINK_TYPES, type Collection, type LinkItem, type LinkType, type SortKey, type ViewFilter } from "@/lib/types";
import { looksLikeUrl } from "@/lib/url";
import { useLibrary } from "@/lib/use-library";
import { AccountMenu } from "./account-menu";
import { CollectionDialog } from "./collection-dialog";
import { LinkCard, LinkRow, type CardActions } from "./link-card";
import { LinkFormDialog } from "./link-form";
import { Sidebar } from "./sidebar";

type Layout = "grid" | "list";

/* Persisted UI preference (grid/list) without setState-in-effect. */
const LAYOUT_KEY = "stash:layout";
const layoutListeners = new Set<() => void>();
const useLayoutPref = () => {
  const layout = useSyncExternalStore(
    (cb) => {
      layoutListeners.add(cb);
      return () => layoutListeners.delete(cb);
    },
    () => (localStorage.getItem(LAYOUT_KEY) as Layout | null) ?? "grid",
    () => "grid" as Layout,
  );
  const set = (l: Layout) => {
    localStorage.setItem(LAYOUT_KEY, l);
    layoutListeners.forEach((cb) => cb());
  };
  return [layout, set] as const;
};

const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

interface Props {
  store: LibraryStore;
  email: string;
  onSignOut: () => void;
}

export function Library({ store, email, onSignOut }: Props) {
  const lib = useLibrary(store);
  const toast = useToast();
  const isMac = useIsMac();
  const demo = store.mode === "demo";

  const [view, setView] = useState<ViewFilter>({ kind: "all" });
  const [type, setType] = useState<LinkType | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [layout, setLayout] = useLayoutPref();
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState<{ open: boolean; editing: LinkItem | null; url?: string }>({ open: false, editing: null });
  const [colDialog, setColDialog] = useState<{ open: boolean; editing: Collection | null }>({ open: false, editing: null });
  const [confirmDelete, setConfirmDelete] = useState<Collection | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { links, collections } = lib;

  /* ---------- derived data ---------- */
  const collectionMap = useMemo(() => new Map(collections.map((c) => [c.id, c])), [collections]);
  const existingUrls = useMemo(() => new Map(links.map((l) => [l.url, l])), [links]);

  // If the collection being viewed disappears (deleted here or on another device), fall back to All.
  const activeView: ViewFilter = useMemo(
    () => (view.kind === "collection" && !collectionMap.has(view.id) ? { kind: "all" } : view),
    [view, collectionMap],
  );

  const counts = useMemo(() => {
    const byCollection: Record<string, number> = {};
    let favorites = 0;
    let unread = 0;
    for (const l of links) {
      if (l.is_favorite) favorites++;
      if (!l.is_done) unread++;
      if (l.collection_id) byCollection[l.collection_id] = (byCollection[l.collection_id] ?? 0) + 1;
    }
    return { all: links.length, favorites, unread, byCollection };
  }, [links]);

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    links.forEach((l) => l.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [links]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    links.filter((l) => matchesView(l, activeView)).forEach((l) => {
      c.all++;
      c[l.type] = (c[l.type] ?? 0) + 1;
    });
    return c;
  }, [links, activeView]);

  const visible = useMemo(
    () => applyQuery(links, { view: activeView, type, tag, search, sort }),
    [links, activeView, type, tag, search, sort],
  );

  const viewTitle =
    activeView.kind === "all"
      ? "All links"
      : activeView.kind === "favorites"
        ? "Favorites"
        : activeView.kind === "unread"
          ? "To watch & read"
          : (collectionMap.get(activeView.id)?.name ?? "Collection");

  const filtersActive = type !== "all" || Boolean(tag) || Boolean(search.trim());

  /* ---------- actions ---------- */
  const openAdd = useCallback((url?: string) => setForm({ open: true, editing: null, url }), []);

  const actions: CardActions = useMemo(
    () => ({
      onToggleFavorite: (l) => void lib.updateLink(l.id, { is_favorite: !l.is_favorite }),
      onToggleDone: (l) => void lib.updateLink(l.id, { is_done: !l.is_done }),
      onEdit: (l) => setForm({ open: true, editing: l }),
      onDelete: (l) => void lib.deleteLink(l),
      onCopy: (l) => {
        navigator.clipboard?.writeText(l.url).then(
          () => toast({ message: "Link copied" }),
          () => toast({ tone: "error", message: "Couldn't access the clipboard" }),
        );
      },
      onMove: (l, collectionId) => {
        void lib.updateLink(l.id, { collection_id: collectionId });
        const name = collectionId ? collectionMap.get(collectionId)?.name : null;
        toast({ message: name ? `Moved to ${name}` : "Removed from collection" });
      },
      onTagClick: (t) => setTag((cur) => (cur === t ? null : t)),
    }),
    [lib, toast, collectionMap],
  );

  const selectView = (v: ViewFilter) => {
    setView(v);
    setDrawer(false);
  };

  const clearFilters = () => {
    setType("all");
    setTag(null);
    setSearch("");
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      openAdd(looksLikeUrl(text) ? text.trim() : undefined);
    } catch {
      openAdd();
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = parseImport(await file.text());
      // Recreate collections by name, then remap link collection ids.
      const idMap = new Map<string, string>();
      for (const c of parsed.collections) {
        const existing = collections.find((x) => x.name.toLowerCase() === c.name.toLowerCase());
        const target = existing ?? (await lib.addCollection(c.name, c.color));
        if (target) idMap.set(c.id, target.id);
      }
      const remapped = parsed.links.map((l) => ({ ...l, collection_id: l.collection_id ? (idMap.get(l.collection_id) ?? null) : null }));
      const n = await lib.importLinks(remapped);
      toast({
        message: n ? `Imported ${n} link${n === 1 ? "" : "s"}` : "Nothing new to import — those links are already saved",
        tone: n ? "success" : "info",
      });
    } catch {
      toast({ tone: "error", message: "That file couldn't be read. Use a Stash .json export or a browser bookmarks .html file." });
    }
  };

  /* ---------- keyboard shortcuts & paste-to-save ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("[role=dialog]")) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openAdd();
      }
    };
    const onPaste = (e: ClipboardEvent) => {
      if (isTypingTarget(e.target) || document.querySelector("[role=dialog]")) return;
      const text = e.clipboardData?.getData("text") ?? "";
      if (looksLikeUrl(text)) {
        e.preventDefault();
        openAdd(text.trim());
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, [openAdd]);

  /* ---------- pieces ---------- */
  const sidebar = (group: string) => (
    <Sidebar
      layoutGroup={group}
      view={activeView}
      onView={selectView}
      counts={counts}
      collections={collections}
      tags={tags}
      activeTag={tag}
      onTag={(t) => {
        setTag(t);
        setDrawer(false);
      }}
      onNewCollection={() => setColDialog({ open: true, editing: null })}
      onEditCollection={(c) => setColDialog({ open: true, editing: c })}
      onDeleteCollection={setConfirmDelete}
    />
  );

  const account = (side: "top" | "bottom", align: "start" | "end") => (
    <AccountMenu
      email={email}
      demo={demo}
      side={side}
      align={align}
      onExport={() => exportJson(links, collections)}
      onImport={() => fileRef.current?.click()}
      onSignOut={onSignOut}
    />
  );

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <Aurora className="fixed" />

      {/* ---------- Desktop sidebar ---------- */}
      <aside className="glass thin-scroll fixed inset-y-0 left-0 z-20 hidden w-72 flex-col gap-6 overflow-y-auto rounded-none border-y-0 border-l-0 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo href="/app" />
        </div>
        <Button variant="primary" size="md" onClick={() => openAdd()} className="w-full">
          <Plus className="size-[18px]" aria-hidden strokeWidth={2.5} /> Save a link
          <kbd className="ml-auto rounded-md bg-black/15 px-1.5 py-0.5 text-[11px] font-medium">N</kbd>
        </Button>
        {sidebar("desktop")}
        <div className="mt-auto space-y-3">
          {demo && <DemoNote />}
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-2">
            {account("top", "start")}
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{demo ? "Demo library" : email}</p>
              <p className="text-xs text-subtle">{demo ? "This browser only" : "Synced across devices"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Library navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(_, i) => (i.offset.x < -80 || i.velocity.x < -500) && setDrawer(false)}
              className="glass-overlay thin-scroll pb-safe absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col gap-6 overflow-y-auto rounded-none border-y-0 border-l-0 px-4 pt-[max(1.25rem,env(safe-area-inset-top))]"
            >
              <div className="flex items-center justify-between px-2">
                <Logo href="/app" />
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Close navigation"
                  className="grid size-11 place-items-center rounded-xl text-muted hover:bg-white/5"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              {sidebar("mobile")}
              {demo && <DemoNote />}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ---------- Main ---------- */}
      <div className="relative lg:pl-72">
        <header className="glass-overlay sticky top-0 z-30 rounded-none border-x-0 border-t-0 pt-[env(safe-area-inset-top)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-white/5 hover:text-text lg:hidden"
            >
              <MenuIcon className="size-5" aria-hidden />
            </button>
            <div className="lg:hidden">
              <Logo href="/app" />
            </div>

            <div className="relative ml-auto hidden flex-1 sm:block lg:ml-0 lg:max-w-xl">
              <SearchBox inputRef={searchRef} value={search} onChange={setSearch} hint={isMac ? "⌘K" : "Ctrl K"} />
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:ml-0 lg:ml-auto">
              <Menu
                items={(Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({
                  label: SORT_LABELS[k],
                  icon: sort === k ? Check : undefined,
                  onSelect: () => setSort(k),
                }))}
                trigger={(p) => (
                  <button
                    {...p}
                    type="button"
                    aria-label={`Sort: ${SORT_LABELS[sort]}`}
                    className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
                  >
                    <ArrowDownUp className="size-[18px]" aria-hidden />
                    <span className="hidden xl:inline">{SORT_LABELS[sort]}</span>
                  </button>
                )}
              />
              <div role="group" aria-label="Layout" className="hidden rounded-xl border border-line p-0.5 sm:flex">
                {(["grid", "list"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLayout(l)}
                    aria-pressed={layout === l}
                    aria-label={l === "grid" ? "Grid view" : "List view"}
                    className={`relative grid size-9 place-items-center rounded-[10px] transition-colors ${
                      layout === l ? "text-text" : "text-subtle hover:text-muted"
                    }`}
                  >
                    {layout === l && (
                      <motion.span layoutId="layout-pill" className="absolute inset-0 rounded-[10px] bg-white/[0.09]" />
                    )}
                    {l === "grid" ? <LayoutGrid className="relative size-[18px]" aria-hidden /> : <List className="relative size-[18px]" aria-hidden />}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block lg:hidden">
                <Button variant="primary" size="md" onClick={() => openAdd()}>
                  <Plus className="size-[18px]" aria-hidden strokeWidth={2.5} /> Save
                </Button>
              </div>
              <div className="lg:hidden">{account("bottom", "end")}</div>
            </div>
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <SearchBox inputRef={searchRef} value={search} onChange={setSearch} />
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={viewTitle}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.15 } }}
                className="text-3xl font-semibold sm:text-4xl"
              >
                {viewTitle}
              </motion.h1>
            </AnimatePresence>
            {lib.status === "ready" && (
              <p className="text-sm text-muted" aria-live="polite">
                {visible.length} {visible.length === 1 ? "link" : "links"}
                {tag && (
                  <button
                    type="button"
                    onClick={() => setTag(null)}
                    className="ml-2 inline-flex min-h-8 items-center gap-1 rounded-full bg-lime/15 px-2.5 text-xs text-lime"
                  >
                    #{tag} <X className="size-3" aria-label="Clear tag filter" />
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Type filter chips */}
          <LayoutGroup id="type-chips">
            <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by type">
              {(["all", ...LINK_TYPES] as const).map((t) => {
                const active = type === t;
                const meta = t === "all" ? null : TYPE_META[t];
                const Icon = meta?.icon ?? Sparkles;
                const n = typeCounts[t] ?? 0;
                if (t !== "all" && n === 0 && !active) return null;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className={`relative flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                      active ? "border-transparent text-on-lime" : "border-line text-muted hover:border-line-strong hover:text-text"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="chip-active"
                        className="absolute inset-0 rounded-full bg-lime"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <Icon className="relative size-4" aria-hidden style={!active && meta ? { color: meta.color } : undefined} />
                    <span className="relative font-medium">{t === "all" ? "Everything" : meta!.plural}</span>
                    <span className={`relative text-xs tabular-nums ${active ? "text-on-lime/70" : "text-subtle"}`}>{n}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="mt-6 sm:mt-8">
            {lib.status === "loading" ? (
              <SkeletonGrid />
            ) : lib.status === "error" ? (
              <EmptyState
                icon={<SearchX className="size-7" aria-hidden />}
                title="We couldn't load your library"
                body="Check your connection and try again. Your links are safe."
                action={<Button variant="primary" onClick={() => void lib.reload()}>Try again</Button>}
              />
            ) : links.length === 0 ? (
              <EmptyState
                big
                icon={<Sparkles className="size-7" aria-hidden />}
                title="Your stash is empty — for now"
                body="Save your first video, doc or article. Tip: copy any link and press Ctrl/⌘ V anywhere on this page."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="primary" size="lg" onClick={() => openAdd()}>
                      <Plus className="size-5" aria-hidden /> Save a link
                    </Button>
                    <Button size="lg" onClick={() => void pasteFromClipboard()}>
                      <ClipboardPaste className="size-5" aria-hidden /> Paste from clipboard
                    </Button>
                  </div>
                }
              />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={<SearchX className="size-7" aria-hidden />}
                title="Nothing matches"
                body={search ? `No links match “${search}”. Try a different word or clear the filters.` : "No links here yet."}
                action={
                  filtersActive ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                  ) : (
                    <Button variant="primary" onClick={() => openAdd()}>
                      <Plus className="size-[18px]" aria-hidden /> Save a link here
                    </Button>
                  )
                }
              />
            ) : layout === "grid" ? (
              <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-5">
                <AnimatePresence mode="popLayout" initial={true}>
                  {visible.map((l, i) => (
                    <LinkCard
                      key={l.id}
                      link={l}
                      index={i}
                      collection={l.collection_id ? collectionMap.get(l.collection_id) : undefined}
                      collections={collections}
                      actions={actions}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div className="flex flex-col gap-1">
                <AnimatePresence mode="popLayout">
                  {visible.map((l, i) => (
                    <LinkRow
                      key={l.id}
                      link={l}
                      index={i}
                      collection={l.collection_id ? collectionMap.get(l.collection_id) : undefined}
                      collections={collections}
                      actions={actions}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* ---------- Mobile floating add button ---------- */}
      <motion.button
        type="button"
        onClick={() => openAdd()}
        aria-label="Save a link"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
        className="bottom-safe fixed right-5 z-30 grid size-16 place-items-center rounded-[20px] bg-lime text-on-lime shadow-[0_10px_28px_-10px_rgba(0,0,0,0.7)] sm:hidden"
      >
        <Plus className="size-7" aria-hidden strokeWidth={2.5} />
      </motion.button>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.html,.htm,application/json,text/html"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImportFile(f);
          e.target.value = "";
        }}
      />

      <LinkFormDialog
        open={form.open}
        editing={form.editing}
        initialUrl={form.url}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        defaultCollectionId={activeView.kind === "collection" ? activeView.id : null}
        collections={collections}
        allTags={tags.map(([t]) => t)}
        existingUrls={existingUrls}
        onCreateCollection={(name) => lib.addCollection(name, "#C8F560")}
        onSubmit={(data) => {
          if (form.editing) {
            void lib.updateLink(form.editing.id, data);
            toast({ message: "Changes saved" });
          } else {
            void lib.addLink(data);
          }
        }}
      />

      <CollectionDialog
        open={colDialog.open}
        editing={colDialog.editing}
        onClose={() => setColDialog((c) => ({ ...c, open: false }))}
        onSave={(name, color) => {
          if (colDialog.editing) void lib.updateCollection(colDialog.editing.id, { name, color });
          else
            void lib.addCollection(name, color).then((c) => {
              if (c) setView({ kind: "collection", id: c.id });
            });
        }}
      />

      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title={`Delete “${confirmDelete?.name ?? ""}”?`}
        description="The collection is removed. Its links stay in your library under All links."
        size="sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmDelete) void lib.deleteCollection(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Delete collection
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function SearchBox({
  inputRef,
  value,
  onChange,
  hint,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  // Only one SearchBox is visible at a time; give the ref to whichever is rendered visibly.
  const localRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    const sync = () => {
      if (el.offsetParent !== null) inputRef.current = el;
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [inputRef]);

  return (
    <div className="group relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle transition-colors group-focus-within:text-text" aria-hidden />
      <input
        ref={localRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            e.currentTarget.blur();
          }
        }}
        placeholder="Search titles, notes, tags, sites…"
        aria-label="Search your links"
        enterKeyHint="search"
        className="glass h-11 w-full rounded-2xl pl-11 pr-16 text-[15px] text-text outline-none transition-[border-color,background-color] placeholder:text-subtle hover:border-white/20 focus:border-lime/60 focus:bg-white/[0.09] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-subtle hover:bg-white/5 hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : (
        hint && (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-subtle">
            {hint}
          </kbd>
        )
      )}
    </div>
  );
}

function DemoNote() {
  return (
    <div className="glass rounded-2xl p-3.5 text-[13px] leading-relaxed text-muted">
      <p className="font-medium text-text">Demo mode</p>
      Links are saved in this browser. Add your Supabase keys to turn on accounts and sync across devices.
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
  big,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  big?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass relative mx-auto flex max-w-lg flex-col items-center overflow-hidden rounded-[20px] px-6 text-center ${
        big ? "py-16 sm:py-20" : "py-12"
      }`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mb-5 grid size-16 place-items-center rounded-2xl bg-white/[0.07] text-text ring-1 ring-white/12"
      >
        {icon}
      </motion.div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-5" aria-label="Loading links" role="status">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="glass overflow-hidden rounded-[20px]">
          <div className="skeleton aspect-[16/9]" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-4 w-4/5 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
