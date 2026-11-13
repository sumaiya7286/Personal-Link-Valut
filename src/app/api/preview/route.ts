import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { detectType, getYouTubeId, normalizeUrl } from "@/lib/url";
import type { LinkPreview, LinkType } from "@/lib/types";

const TIMEOUT_MS = 6000;
const MAX_BYTES = 768 * 1024;
const MAX_REDIRECTS = 4;
const UA = "Mozilla/5.0 (compatible; StashPreviewBot/1.0; +link-preview)";

/* ---------- SSRF guard: refuse anything that resolves to a private network ---------- */

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

function isPrivateIP(ip: string) {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIPv4(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("ff");
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal"))
    throw new Error("blocked host");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIP(a.address))) throw new Error("blocked host");
}

async function safeFetch(start: string): Promise<{ res: Response; finalUrl: string }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    await assertPublicHost(u.hostname);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "accept-language": "en" },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).toString();
      continue;
    }
    return { res, finalUrl: url };
  }
  throw new Error("too many redirects");
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
    // Metadata lives in <head>; stop once we've passed it.
    if (new TextDecoder().decode(value).includes("</head>")) break;
  }
  void reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/* ---------- HTML metadata parsing ---------- */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();

function attr(tag: string, name: string) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function parseHtml(html: string, base: string) {
  const metas = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? attr(tag, "itemprop"))?.toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !metas.has(key)) metas.set(key, decode(content));
  }
  const get = (...keys: string[]) => keys.map((k) => metas.get(k)).find(Boolean) ?? null;
  const abs = (v: string | null) => {
    if (!v) return null;
    try {
      const u = new URL(v, base);
      return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
    } catch {
      return null;
    }
  };

  let favicon: string | null = null;
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attr(tag, "rel")?.toLowerCase() ?? "";
    if (/(^|\s)(icon|apple-touch-icon)(\s|$)/.test(rel)) {
      const href = abs(attr(tag, "href"));
      if (href && (!favicon || rel.includes("apple-touch-icon"))) favicon = href;
    }
  }

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const ogType = get("og:type")?.toLowerCase() ?? "";
  let type: LinkType | null = null;
  if (ogType.startsWith("video")) type = "video";
  else if (ogType === "article") type = "article";

  return {
    title: get("og:title", "twitter:title") ?? (titleTag ? decode(titleTag) : null),
    description: get("og:description", "twitter:description", "description"),
    image: abs(get("og:image:secure_url", "og:image", "twitter:image", "twitter:image:src")),
    siteName: get("og:site_name", "application-name"),
    favicon: favicon ?? abs("/favicon.ico"),
    type,
  };
}

const clip = (s: string | null, n: number) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

async function oEmbed(endpoint: string): Promise<{ title?: string; author_name?: string; thumbnail_url?: string } | null> {
  try {
    const r = await fetch(endpoint, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": UA } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = normalizeUrl(request.nextUrl.searchParams.get("url") ?? "");
  if (!url || url.length > 2048) return NextResponse.json({ error: "Enter a valid http(s) link." }, { status: 400 });

  // With accounts enabled, only signed-in users may use the preview fetcher.
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServer();
    const { data } = await sb.auth.getClaims();
    if (!data?.claims?.sub) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const preview: LinkPreview = {
    url,
    title: null,
    description: null,
    image: null,
    favicon: null,
    siteName: null,
    type: detectType(url),
  };

  const ytId = getYouTubeId(url);
  if (ytId) {
    const data = await oEmbed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
    Object.assign(preview, {
      title: data?.title ?? null,
      description: data?.author_name ? `by ${data.author_name}` : null,
      image: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      siteName: "YouTube",
      favicon: "https://www.youtube.com/favicon.ico",
      type: "video",
    });
    return NextResponse.json(preview, { headers: { "cache-control": "private, max-age=86400" } });
  }

  try {
    const { res, finalUrl } = await safeFetch(url);
    const ctype = res.headers.get("content-type") ?? "";
    if (ctype.startsWith("image/")) {
      Object.assign(preview, { image: finalUrl, type: "image" });
    } else if (ctype.includes("application/pdf")) {
      preview.type = "doc";
    } else if (ctype.includes("html")) {
      const meta = parseHtml(await readCapped(res), finalUrl);
      Object.assign(preview, {
        title: clip(meta.title, 300),
        description: clip(meta.description, 400),
        image: meta.image,
        favicon: meta.favicon,
        siteName: clip(meta.siteName, 120),
        type: preview.type !== "other" ? preview.type : (meta.type ?? "other"),
      });
    } else {
      void res.body?.cancel();
    }
  } catch {
    // Unreachable or blocked: return the URL-based guess so the user can still save it.
  }

  return NextResponse.json(preview, { headers: { "cache-control": "private, max-age=86400" } });
}
