"use client";

import { useState } from "react";
import type { LinkItem } from "@/lib/types";
import { getDomain, hueFor, youTubeThumb } from "@/lib/url";
import { TYPE_META } from "./type-meta";

export function Favicon({ link, className = "size-4" }: { link: Pick<LinkItem, "url" | "favicon_url">; className?: string }) {
  const domain = getDomain(link.url);
  const candidates = [link.favicon_url, `https://${domain}/favicon.ico`].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  if (!src) {
    const hue = hueFor(domain);
    return (
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-[5px] text-[9px] font-bold uppercase text-black ${className}`}
        style={{ background: `hsl(${hue} 80% 70%)` }}
      >
        {domain.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party favicons
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`shrink-0 rounded-[5px] object-contain ${className}`}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

/** Thumbnail for a link: og:image / YouTube thumb, or generated cover art when none is available. */
export function Cover({ link, className = "" }: { link: LinkItem; className?: string }) {
  const src = link.image_url ?? youTubeThumb(link.url);
  const [failed, setFailed] = useState(false);
  const domain = getDomain(link.url);
  const hue = hueFor(domain);
  const meta = TYPE_META[link.type];
  const Icon = meta.icon;

  if (src && !failed) {
    return (
      <div className={`relative overflow-hidden bg-ink-800 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote thumbnails */}
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.05]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
        {link.type === "video" && (
          <div aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-black/50 text-white ring-1 ring-white/25 backdrop-blur-md transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-current">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
              </svg>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 0% 0%, hsl(${hue} 18% 20%) 0%, transparent 60%),
          radial-gradient(90% 80% at 100% 100%, color-mix(in oklab, ${meta.color} 14%, transparent) 0%, transparent 60%),
          linear-gradient(135deg, #12151b, #0b0d11)`,
      }}
    >
      <div className="grid-bg absolute inset-0 opacity-60" />
      <Icon
        className="absolute -bottom-6 -right-4 size-32 opacity-[0.09] transition-transform duration-700 ease-[var(--ease-out)] group-hover:-rotate-6 group-hover:scale-110"
        style={{ color: meta.color }}
        strokeWidth={1.25}
      />
      <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-md">
          <Favicon link={link} className="size-6" />
        </span>
        <span className="max-w-[12rem] truncate font-display text-lg font-semibold text-white/85">{domain}</span>
      </div>
    </div>
  );
}
