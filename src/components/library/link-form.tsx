"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Link2, Loader2, Plus, Star } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { Dialog } from "@/components/ui/dialog";
import { TYPE_META } from "@/components/ui/type-meta";
import { useDebounced, useIsMac } from "@/lib/hooks";
import { LINK_TYPES, type Collection, type LinkItem, type LinkPreview, type LinkType, type NewLink } from "@/lib/types";
import { detectType, getDomain, normalizeUrl } from "@/lib/url";
import { TagInput } from "./tag-input";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Present when editing an existing link. */
  editing?: LinkItem | null;
  initialUrl?: string;
  defaultCollectionId?: string | null;
  collections: Collection[];
  allTags: string[];
  existingUrls: Map<string, LinkItem>;
  onSubmit: (data: NewLink) => void;
  onCreateCollection: (name: string) => Promise<Collection | null>;
}

const field =
  "w-full rounded-2xl border border-line bg-white/[0.03] px-4 text-[15px] text-text outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-lime/60 focus:bg-white/[0.05]";
const label = "mb-2 block text-sm font-medium text-muted";

export function LinkFormDialog(props: Props) {
  const { open, onClose, editing } = props;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit link" : "Save a link"}
      description={editing ? undefined : "Paste any video, doc or page. We'll fetch the details for you."}
    >
      {/* Remount per open so the form starts fresh each time. */}
      {open && <LinkForm key={editing?.id ?? props.initialUrl ?? "new"} {...props} />}
    </Dialog>
  );
}

function LinkForm({
  onClose,
  editing,
  initialUrl = "",
  defaultCollectionId = null,
  collections,
  allTags,
  existingUrls,
  onSubmit,
  onCreateCollection,
}: Props) {
  const ids = { url: useId(), title: useId(), notes: useId(), tags: useId(), col: useId() };
  const isMac = useIsMac();
  const [url, setUrl] = useState(editing?.url ?? initialUrl);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [titleTouched, setTitleTouched] = useState(Boolean(editing));
  const [type, setType] = useState<LinkType>(editing?.type ?? "other");
  const [typeTouched, setTypeTouched] = useState(Boolean(editing));
  const [collectionId, setCollectionId] = useState<string | null>(editing?.collection_id ?? defaultCollectionId);
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [favorite, setFavorite] = useState(editing?.is_favorite ?? false);
  // Preview result keyed by the URL it was fetched for; "loading" is derived, not stored.
  const [fetched, setFetched] = useState<{ url: string; preview: LinkPreview | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCol, setNewCol] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const touched = useRef({ title: titleTouched, type: typeTouched });
  useEffect(() => {
    touched.current = { title: titleTouched, type: typeTouched };
  }, [titleTouched, typeTouched]);

  const normalized = normalizeUrl(url);
  const debouncedUrl = useDebounced(normalized, 450);
  const needsFetch = Boolean(debouncedUrl) && !(editing && debouncedUrl === editing.url);
  const preview = fetched && fetched.url === normalized ? fetched.preview : null;
  const loading = Boolean(normalized) && needsFetch && (normalized !== debouncedUrl || fetched?.url !== debouncedUrl);
  const duplicate = normalized && !editing ? existingUrls.get(normalized) : undefined;

  // Fetch a preview whenever the URL settles (add mode, or if the URL was changed while editing).
  useEffect(() => {
    if (!debouncedUrl || !needsFetch) return;
    const ctrl = new AbortController();
    fetch(`/api/preview?url=${encodeURIComponent(debouncedUrl)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<LinkPreview>) : null))
      .then((p) => {
        setFetched({ url: debouncedUrl, preview: p });
        if (!p) return;
        if (!touched.current.title && p.title) setTitle(p.title);
        if (!touched.current.type && p.type) setType(p.type);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFetched({ url: debouncedUrl, preview: null });
      });
    return () => ctrl.abort();
  }, [debouncedUrl, needsFetch]);

  const guessedType = useMemo(() => (normalized ? detectType(normalized) : null), [normalized]);
  const effectiveType = typeTouched ? type : (preview?.type ?? guessedType ?? type);

  const previewLink: LinkItem | null = normalized
    ? {
        id: "preview",
        url: normalized,
        title: title || preview?.title || getDomain(normalized),
        description: preview?.description ?? editing?.description ?? null,
        image_url: preview?.image ?? (normalized === editing?.url ? editing.image_url : null),
        favicon_url: preview?.favicon ?? (normalized === editing?.url ? editing.favicon_url : null),
        site_name: preview?.siteName ?? editing?.site_name ?? null,
        type: effectiveType,
        collection_id: collectionId,
        tags,
        notes,
        is_favorite: favorite,
        is_done: editing?.is_done ?? false,
        created_at: "",
        updated_at: "",
      }
    : null;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!normalized || !previewLink) {
      setError("Enter a valid link, like youtube.com/watch?v=… or docs.google.com/…");
      return;
    }
    onSubmit({
      url: normalized,
      title: (title.trim() || previewLink.title).slice(0, 300),
      description: previewLink.description?.slice(0, 1000) ?? null,
      image_url: previewLink.image_url,
      favicon_url: previewLink.favicon_url,
      site_name: previewLink.site_name?.slice(0, 120) ?? null,
      type: effectiveType,
      collection_id: collectionId,
      tags,
      notes: notes.trim() ? notes.trim().slice(0, 5000) : null,
      is_favorite: favorite,
      is_done: editing?.is_done ?? false,
    });
    onClose();
  };

  const createCollection = async () => {
    const name = newCol?.trim();
    if (!name) return setNewCol(null);
    const c = await onCreateCollection(name.slice(0, 60));
    if (c) setCollectionId(c.id);
    setNewCol(null);
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
      }}
      className="space-y-5"
      noValidate
    >
      <div>
        <label htmlFor={ids.url} className={label}>
          Link
        </label>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-subtle" aria-hidden />
          <input
            id={ids.url}
            data-autofocus={editing ? undefined : true}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://…"
            inputMode="url"
            type="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${ids.url}-err` : undefined}
            className={`${field} h-13 pl-11 pr-11 font-mono text-sm`}
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 size-[18px] -translate-y-1/2 animate-spin text-muted" aria-label="Fetching preview" />
          )}
        </div>
        {error && (
          <p id={`${ids.url}-err`} role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
        <AnimatePresence>
          {duplicate && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-2 overflow-hidden text-sm text-[#FFD166]"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Already in your stash as “{duplicate.title || getDomain(duplicate.url)}”. Saving again adds a copy.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        {previewLink && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="group flex gap-4 overflow-hidden rounded-2xl border border-line bg-white/[0.025] p-2.5"
          >
            {loading && !preview ? (
              <div className="skeleton aspect-[16/10] w-28 shrink-0 rounded-xl sm:w-36" />
            ) : (
              <Cover
                key={`${previewLink.image_url}-${previewLink.favicon_url}`}
                link={previewLink}
                className="aspect-[16/10] w-28 shrink-0 rounded-xl sm:w-36"
              />
            )}
            <div className="min-w-0 flex-1 py-1">
              {loading && !preview ? (
                <div className="space-y-2">
                  <div className="skeleton h-4 w-4/5 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-3/5 rounded" />
                </div>
              ) : (
                <>
                  <p className="line-clamp-2 font-display font-semibold leading-snug">{previewLink.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">{getDomain(previewLink.url)}</p>
                  {previewLink.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-subtle">{previewLink.description}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label htmlFor={ids.title} className={label}>
          Title
        </label>
        <input
          id={ids.title}
          data-autofocus={editing ? true : undefined}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(true);
          }}
          placeholder={preview?.title ?? "Give it a name you'll recognise"}
          maxLength={300}
          className={`${field} h-12`}
        />
      </div>

      <fieldset>
        <legend className={label}>Type</legend>
        <div className="grid grid-cols-5 gap-1.5 rounded-2xl border border-line bg-white/[0.02] p-1.5">
          {LINK_TYPES.map((t) => {
            const m = TYPE_META[t];
            const active = effectiveType === t;
            return (
              <label
                key={t}
                className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-colors sm:flex-row sm:gap-1.5 sm:text-sm ${
                  active ? "text-text" : "text-subtle hover:text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={active}
                  onChange={() => {
                    setType(t);
                    setTypeTouched(true);
                  }}
                  className="peer sr-only"
                />
                {active && (
                  <motion.span
                    layoutId="type-pill"
                    className="absolute inset-0 rounded-xl border"
                    style={{
                      background: `color-mix(in oklab, ${m.color} 14%, transparent)`,
                      borderColor: `color-mix(in oklab, ${m.color} 40%, transparent)`,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-lime" />
                <m.icon className="relative size-4" style={{ color: active ? m.color : undefined }} aria-hidden />
                <span className="relative">{m.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={ids.col} className={label}>
          Collection
        </label>
        {newCol === null ? (
          <div className="flex gap-2">
            <select
              id={ids.col}
              value={collectionId ?? ""}
              onChange={(e) => setCollectionId(e.target.value || null)}
              className={`${field} h-12 appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23a0a6b1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6 4 4 4-4'/></svg>")] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10`}
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button size="fieldIcon" onClick={() => setNewCol("")} aria-label="Create new collection">
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id={ids.col}
              autoFocus
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createCollection();
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  setNewCol(null);
                }
              }}
              placeholder="New collection name"
              maxLength={60}
              className={`${field} h-12`}
            />
            <Button variant="primary" size="field" onClick={() => void createCollection()}>
              Create
            </Button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={ids.tags} className={label}>
          Tags
        </label>
        <TagInput id={ids.tags} value={tags} onChange={setTags} suggestions={allTags} />
      </div>

      <div>
        <label htmlFor={ids.notes} className={label}>
          Notes <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id={ids.notes}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Why is this worth keeping? Timestamps, key points…"
          className={`${field} resize-y py-3 leading-relaxed`}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setFavorite((f) => !f)}
          aria-pressed={favorite}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm transition-colors hover:bg-white/[0.05] ${
            favorite ? "text-[#FFD166]" : "text-muted"
          }`}
        >
          <Star className={`size-[18px] ${favorite ? "fill-current" : ""}`} aria-hidden />
          {favorite ? "Favorite" : "Mark as favorite"}
        </button>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 sm:flex-none" disabled={!normalized}>
            {editing ? "Save changes" : "Save link"}
            <kbd className="hidden rounded-md bg-black/15 px-1.5 py-0.5 font-sans text-[11px] font-medium sm:inline">
              {isMac ? "⌘" : "Ctrl"} ↵
            </kbd>
          </Button>
        </div>
      </div>
    </form>
  );
}
