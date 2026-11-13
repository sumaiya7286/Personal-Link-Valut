import type { Collection, LinkItem, LinkPatch, NewLink } from "../types";

export interface LibraryStore {
  readonly mode: "cloud" | "demo";
  load(): Promise<{ links: LinkItem[]; collections: Collection[] }>;
  addLink(input: NewLink): Promise<LinkItem>;
  addLinks(input: NewLink[]): Promise<LinkItem[]>;
  updateLink(id: string, patch: LinkPatch): Promise<LinkItem>;
  deleteLink(id: string): Promise<void>;
  addCollection(input: { name: string; color: string; id?: string }): Promise<Collection>;
  updateCollection(id: string, patch: Partial<Pick<Collection, "name" | "color">>): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  /** Called when data changes elsewhere (another tab or device). Returns an unsubscribe function. */
  subscribe(onRemoteChange: () => void): () => void;
}
