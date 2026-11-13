"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { LibraryStore } from "./store/types";
import { newId } from "./id";
import type { Collection, LinkItem, LinkPatch, NewLink } from "./types";

type Status = "loading" | "ready" | "error";

/** Library state with optimistic updates: the UI changes instantly, the store catches up. */
export function useLibrary(store: LibraryStore | null) {
  const toast = useToast();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const pending = useRef(0);

  const reload = useCallback(async () => {
    if (!store) return;
    try {
      const data = await store.load();
      // Skip remote refreshes while local writes are in flight, so optimistic state isn't clobbered.
      if (pending.current > 0) return;
      setLinks(data.links);
      setCollections(data.collections);
      setStatus("ready");
    } catch {
      setStatus((s) => (s === "ready" ? s : "error"));
    }
  }, [store]);

  useEffect(() => {
    if (!store) return;
    // Initial load, then debounced refreshes on remote changes or when the tab regains focus.
    let timer = window.setTimeout(() => void reload(), 0);
    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void reload(), 400);
    };
    const unsubscribe = store.subscribe(debounced);
    const onFocus = () => document.visibilityState === "visible" && debounced();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [store, reload]);

  /** Runs a store write; on failure, restores the previous state and shows an error. */
  const run = useCallback(
    async (write: () => Promise<unknown>, rollback: () => void, errorMsg: string) => {
      pending.current++;
      try {
        await write();
        return true;
      } catch (e) {
        rollback();
        toast({ tone: "error", message: `${errorMsg}${e instanceof Error && e.message ? ` — ${e.message}` : ""}` });
        return false;
      } finally {
        pending.current--;
      }
    },
    [toast],
  );

  const addLink = useCallback(
    async (input: NewLink) => {
      if (!store) return;
      const now = new Date().toISOString();
      const link: LinkItem = { ...input, id: input.id ?? newId(), created_at: now, updated_at: now };
      setLinks((l) => [link, ...l]);
      const ok = await run(
        () => store.addLink(link),
        () => setLinks((l) => l.filter((x) => x.id !== link.id)),
        "Couldn't save link",
      );
      if (ok) toast({ message: "Saved to your stash" });
    },
    [store, run, toast],
  );

  const updateLink = useCallback(
    async (id: string, patch: LinkPatch) => {
      if (!store) return;
      let before: LinkItem | undefined;
      setLinks((l) =>
        l.map((x) => {
          if (x.id !== id) return x;
          before = x;
          return { ...x, ...patch, updated_at: new Date().toISOString() };
        }),
      );
      await run(
        () => store.updateLink(id, patch),
        () => before && setLinks((l) => l.map((x) => (x.id === id ? before! : x))),
        "Couldn't update link",
      );
    },
    [store, run],
  );

  const deleteLink = useCallback(
    async (link: LinkItem) => {
      if (!store) return;
      setLinks((l) => l.filter((x) => x.id !== link.id));
      const ok = await run(
        () => store.deleteLink(link.id),
        () => setLinks((l) => [link, ...l]),
        "Couldn't delete link",
      );
      if (!ok) return;
      toast({
        message: "Link deleted",
        tone: "info",
        action: {
          label: "Undo",
          onClick: () => {
            setLinks((l) => [link, ...l].sort((a, b) => b.created_at.localeCompare(a.created_at)));
            void run(
              () => store.addLinks([link]),
              () => setLinks((l) => l.filter((x) => x.id !== link.id)),
              "Couldn't restore link",
            );
          },
        },
      });
    },
    [store, run, toast],
  );

  const importLinks = useCallback(
    async (incoming: NewLink[]) => {
      if (!store || incoming.length === 0) return 0;
      const existing = new Set(links.map((l) => l.url));
      const fresh = incoming.filter((l) => !existing.has(l.url)).map((l) => ({ ...l, id: newId() }));
      if (fresh.length === 0) return 0;
      const known = new Set(collections.map((c) => c.id));
      const cleaned = fresh.map((l) => ({ ...l, collection_id: l.collection_id && known.has(l.collection_id) ? l.collection_id : null }));
      const ok = await run(() => store.addLinks(cleaned), () => {}, "Import failed");
      if (ok) await reload();
      return ok ? cleaned.length : 0;
    },
    [store, links, collections, run, reload],
  );

  const addCollection = useCallback(
    async (name: string, color: string) => {
      if (!store) return null;
      const c: Collection = { id: newId(), name, color, created_at: new Date().toISOString() };
      setCollections((cs) => [...cs, c]);
      const ok = await run(
        () => store.addCollection(c),
        () => setCollections((cs) => cs.filter((x) => x.id !== c.id)),
        "Couldn't create collection",
      );
      return ok ? c : null;
    },
    [store, run],
  );

  const updateCollection = useCallback(
    async (id: string, patch: Partial<Pick<Collection, "name" | "color">>) => {
      if (!store) return;
      const before = collections.find((c) => c.id === id);
      setCollections((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      await run(
        () => store.updateCollection(id, patch),
        () => before && setCollections((cs) => cs.map((c) => (c.id === id ? before : c))),
        "Couldn't update collection",
      );
    },
    [store, run, collections],
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      if (!store) return;
      const prevCollections = collections;
      const prevLinks = links;
      setCollections((cs) => cs.filter((c) => c.id !== id));
      setLinks((l) => l.map((x) => (x.collection_id === id ? { ...x, collection_id: null } : x)));
      const ok = await run(
        () => store.deleteCollection(id),
        () => {
          setCollections(prevCollections);
          setLinks(prevLinks);
        },
        "Couldn't delete collection",
      );
      if (ok) toast({ message: "Collection deleted. Its links are still in All links.", tone: "info" });
    },
    [store, run, collections, links, toast],
  );

  return useMemo(
    () => ({
      links,
      collections,
      status,
      reload,
      addLink,
      updateLink,
      deleteLink,
      importLinks,
      addCollection,
      updateCollection,
      deleteCollection,
    }),
    [links, collections, status, reload, addLink, updateLink, deleteLink, importLinks, addCollection, updateCollection, deleteCollection],
  );
}

export type Library = ReturnType<typeof useLibrary>;
