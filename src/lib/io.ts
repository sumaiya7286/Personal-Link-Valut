import type { Collection, LinkItem, LinkType, NewLink } from "./types";
import { LINK_TYPES } from "./types";
import { detectType, normalizeUrl } from "./url";

export interface ImportResult {
  links: NewLink[];
  collections: { id: string; name: string; color: string }[];
}

export function exportJson(links: LinkItem[], collections: Collection[]) {
  const data = { app: "stash", version: 1, exported_at: new Date().toISOString(), collections, links };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `stash-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function toNewLink(raw: Record<string, unknown>): NewLink | null {
  const url = normalizeUrl(String(raw.url ?? raw.href ?? ""));
  if (!url) return null;
  const type = LINK_TYPES.includes(raw.type as LinkType) ? (raw.type as LinkType) : detectType(url);
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase().slice(0, 32)).slice(0, 12)
    : [];
  return {
    url,
    title: str(raw.title, 300) ?? "",
    description: str(raw.description, 1000),
    image_url: str(raw.image_url, 2048),
    favicon_url: str(raw.favicon_url, 2048),
    site_name: str(raw.site_name, 120),
    type,
    collection_id: str(raw.collection_id, 64),
    tags,
    notes: str(raw.notes, 5000),
    is_favorite: raw.is_favorite === true,
    is_done: raw.is_done === true,
    created_at: typeof raw.created_at === "string" && !Number.isNaN(Date.parse(raw.created_at)) ? raw.created_at : undefined,
  };
}

/** Parses a Stash JSON export, or a browser bookmarks HTML export (Chrome, Firefox, Safari, Edge). */
export function parseImport(text: string): ImportResult {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const data = JSON.parse(trimmed) as unknown;
    const rawLinks = Array.isArray(data) ? data : ((data as { links?: unknown[] }).links ?? []);
    const rawCols = Array.isArray(data) ? [] : ((data as { collections?: unknown[] }).collections ?? []);
    return {
      links: rawLinks
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map(toNewLink)
        .filter((x): x is NewLink => x !== null),
      collections: rawCols
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((c) => ({ id: String(c.id ?? ""), name: str(c.name, 60) ?? "", color: str(c.color, 16) ?? "#C8F560" }))
        .filter((c) => c.id && c.name),
    };
  }

  // Netscape bookmark file: each <DT><A HREF="…" ADD_DATE="…">Title</A>
  const links: NewLink[] = [];
  const re = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) && links.length < 5000) {
    const added = m[0].match(/add_date="(\d+)"/i)?.[1];
    const link = toNewLink({
      url: m[1],
      title: m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      created_at: added ? new Date(Number(added) * 1000).toISOString() : undefined,
    });
    if (link) links.push(link);
  }
  return { links, collections: [] };
}
