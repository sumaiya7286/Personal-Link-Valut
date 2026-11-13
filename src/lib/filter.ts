import type { LinkItem, LinkType, SortKey, ViewFilter } from "./types";
import { getDomain } from "./url";

export interface Query {
  view: ViewFilter;
  type: LinkType | "all";
  tag: string | null;
  search: string;
  sort: SortKey;
}

const haystack = (l: LinkItem) =>
  [l.title, l.url, l.description, l.notes, l.site_name, ...l.tags.map((t) => `#${t}`)].join(" ").toLowerCase();

export function matchesView(l: LinkItem, view: ViewFilter) {
  switch (view.kind) {
    case "all":
      return true;
    case "favorites":
      return l.is_favorite;
    case "unread":
      return !l.is_done;
    case "collection":
      return l.collection_id === view.id;
  }
}

export function applyQuery(links: LinkItem[], q: Query): LinkItem[] {
  const tokens = q.search.toLowerCase().split(/\s+/).filter(Boolean);
  const out = links.filter(
    (l) =>
      matchesView(l, q.view) &&
      (q.type === "all" || l.type === q.type) &&
      (!q.tag || l.tags.includes(q.tag)) &&
      (tokens.length === 0 || tokens.every((t) => haystack(l).includes(t))),
  );
  const by: Record<SortKey, (a: LinkItem, b: LinkItem) => number> = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    oldest: (a, b) => a.created_at.localeCompare(b.created_at),
    title: (a, b) => (a.title || a.url).localeCompare(b.title || b.url, undefined, { sensitivity: "base" }),
    site: (a, b) => getDomain(a.url).localeCompare(getDomain(b.url)) || b.created_at.localeCompare(a.created_at),
  };
  return out.sort(by[q.sort]);
}

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title A–Z",
  site: "By website",
};
