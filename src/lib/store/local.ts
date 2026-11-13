"use client";

import { newId } from "../id";
import type { Collection, LinkItem } from "../types";
import { seedCollections, seedLinks } from "../seed";
import type { LibraryStore } from "./types";

const KEY = "stash:v1";

interface Snapshot {
  links: LinkItem[];
  collections: Collection[];
}

const uid = newId;

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {
    /* corrupted or unavailable storage: fall through to seed */
  }
  const seeded = { links: seedLinks(), collections: seedCollections() };
  write(seeded);
  return seeded;
}

function write(s: Snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked */
  }
}

/** Demo-mode store: everything lives in this browser's localStorage. */
export function createLocalStore(): LibraryStore {
  return {
    mode: "demo",
    async load() {
      return read();
    },
    async addLink(input) {
      const [link] = await this.addLinks([input]);
      return link;
    },
    async addLinks(inputs) {
      const s = read();
      const now = new Date().toISOString();
      const created = inputs.map((i) => ({
        ...i,
        id: i.id ?? uid(),
        created_at: i.created_at ?? now,
        updated_at: i.updated_at ?? now,
      }));
      s.links = [...created, ...s.links.filter((l) => !created.some((c) => c.id === l.id))];
      write(s);
      return created;
    },
    async updateLink(id, patch) {
      const s = read();
      const idx = s.links.findIndex((l) => l.id === id);
      if (idx < 0) throw new Error("Link not found");
      s.links[idx] = { ...s.links[idx], ...patch, updated_at: new Date().toISOString() };
      write(s);
      return s.links[idx];
    },
    async deleteLink(id) {
      const s = read();
      s.links = s.links.filter((l) => l.id !== id);
      write(s);
    },
    async addCollection({ name, color, id }) {
      const s = read();
      const c: Collection = { id: id ?? uid(), name, color, created_at: new Date().toISOString() };
      s.collections.push(c);
      write(s);
      return c;
    },
    async updateCollection(id, patch) {
      const s = read();
      const idx = s.collections.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error("Collection not found");
      s.collections[idx] = { ...s.collections[idx], ...patch };
      write(s);
      return s.collections[idx];
    },
    async deleteCollection(id) {
      const s = read();
      s.collections = s.collections.filter((c) => c.id !== id);
      s.links = s.links.map((l) => (l.collection_id === id ? { ...l, collection_id: null } : l));
      write(s);
    },
    subscribe(onRemoteChange) {
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) onRemoteChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
