import type { LinkType } from "./types";

export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withProto = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function looksLikeUrl(text: string): boolean {
  const t = text.trim();
  if (!t || /\s/.test(t) || t.length > 2048) return false;
  return /^https?:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m|music)\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function youTubeThumb(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

const VIDEO_HOSTS = [
  "youtube.com", "youtu.be", "vimeo.com", "loom.com", "twitch.tv", "tiktok.com",
  "dailymotion.com", "wistia.com", "ted.com", "rumble.com", "bilibili.com",
];
const DOC_HOSTS = [
  "docs.google.com", "drive.google.com", "notion.so", "notion.site", "readthedocs.io",
  "gitbook.io", "developer.mozilla.org", "confluence", "coda.io", "quip.com",
  "dropbox.com", "onedrive.live.com", "sharepoint.com", "arxiv.org", "scribd.com",
];
const ARTICLE_HOSTS = [
  "medium.com", "substack.com", "dev.to", "hashnode.dev", "hashnode.com", "nytimes.com",
  "theverge.com", "wired.com", "bbc.co.uk", "bbc.com", "theguardian.com", "news.ycombinator.com",
  "smashingmagazine.com", "css-tricks.com", "paulgraham.com", "wikipedia.org",
];
const IMAGE_HOSTS = ["unsplash.com", "imgur.com", "pinterest.com", "dribbble.com", "behance.net", "flickr.com"];

const matches = (host: string, list: string[]) =>
  list.some((h) => host === h || host.endsWith(`.${h}`) || host.includes(h));

/** Best-effort guess from the URL alone. The preview API can refine it using page metadata. */
export function detectType(url: string): LinkType {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "other";
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const path = u.pathname.toLowerCase();

  if (/\.(mp4|webm|mov|m4v|mkv)$/.test(path) || matches(host, VIDEO_HOSTS)) return "video";
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path) || matches(host, IMAGE_HOSTS)) return "image";
  if (
    /\.(pdf|docx?|pptx?|xlsx?|odt|md|txt|epub)$/.test(path) ||
    matches(host, DOC_HOSTS) ||
    host.startsWith("docs.") ||
    host.startsWith("developer.") ||
    /\/(docs?|documentation|guide|guides|reference|manual|api)(\/|$)/.test(path)
  )
    return "doc";
  if (matches(host, ARTICLE_HOSTS) || host.startsWith("blog.") || /\/(blog|posts?|articles?|news)\//.test(path))
    return "article";
  return "other";
}

/** Stable hue (0-359) for a string, used for generated cover art and avatars. */
export function hueFor(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % 360;
}
