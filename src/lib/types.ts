export type LinkType = "video" | "doc" | "article" | "image" | "other";

export const LINK_TYPES: LinkType[] = ["video", "doc", "article", "image", "other"];

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  type: LinkType;
  collection_id: string | null;
  tags: string[];
  notes: string | null;
  is_favorite: boolean;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export type NewLink = Omit<LinkItem, "id" | "created_at" | "updated_at"> &
  Partial<Pick<LinkItem, "id" | "created_at" | "updated_at">>;

export type LinkPatch = Partial<Omit<LinkItem, "id" | "created_at">>;

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
  type: LinkType | null;
}

export type SortKey = "newest" | "oldest" | "title" | "site";

export type ViewFilter =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "unread" }
  | { kind: "collection"; id: string };
