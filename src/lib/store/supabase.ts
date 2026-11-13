"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Collection, LinkItem } from "../types";
import type { LibraryStore } from "./types";

const LINK_COLS =
  "id,url,title,description,image_url,favicon_url,site_name,type,collection_id,tags,notes,is_favorite,is_done,created_at,updated_at";
const COLLECTION_COLS = "id,name,color,created_at";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Cloud store: rows live in Supabase Postgres and are scoped to the user by RLS. */
export function createSupabaseStore(sb: SupabaseClient, userId: string): LibraryStore {
  return {
    mode: "cloud",
    async load() {
      const [links, collections] = await Promise.all([
        sb.from("links").select(LINK_COLS).order("created_at", { ascending: false }).limit(5000),
        sb.from("collections").select(COLLECTION_COLS).order("created_at", { ascending: true }),
      ]);
      return { links: check(links) as LinkItem[], collections: check(collections) as Collection[] };
    },
    async addLink(input) {
      const [link] = await this.addLinks([input]);
      return link;
    },
    async addLinks(inputs) {
      if (inputs.length === 0) return [];
      const rows = inputs.map((i) => ({ ...i, user_id: userId }));
      return check(await sb.from("links").upsert(rows).select(LINK_COLS)) as LinkItem[];
    },
    async updateLink(id, patch) {
      return check(await sb.from("links").update(patch).eq("id", id).select(LINK_COLS).single()) as LinkItem;
    },
    async deleteLink(id) {
      check(await sb.from("links").delete().eq("id", id));
    },
    async addCollection({ name, color, id }) {
      const row = { name, color, user_id: userId, ...(id ? { id } : {}) };
      return check(await sb.from("collections").insert(row).select(COLLECTION_COLS).single()) as Collection;
    },
    async updateCollection(id, patch) {
      return check(
        await sb.from("collections").update(patch).eq("id", id).select(COLLECTION_COLS).single(),
      ) as Collection;
    },
    async deleteCollection(id) {
      check(await sb.from("collections").delete().eq("id", id));
    },
    subscribe(onRemoteChange) {
      const channel = sb
        .channel(`library:${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "links", filter: `user_id=eq.${userId}` }, onRemoteChange)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "collections", filter: `user_id=eq.${userId}` },
          onRemoteChange,
        )
        .subscribe();
      return () => {
        void sb.removeChannel(channel);
      };
    },
  };
}
