import { FileText, Image as ImageIcon, Link2, Newspaper, Play, type LucideIcon } from "lucide-react";
import type { LinkType } from "@/lib/types";

export const TYPE_META: Record<LinkType, { label: string; plural: string; icon: LucideIcon; color: string; text: string }> = {
  video: { label: "Video", plural: "Videos", icon: Play, color: "var(--type-video)", text: "text-video" },
  doc: { label: "Doc", plural: "Docs", icon: FileText, color: "var(--type-doc)", text: "text-doc" },
  article: { label: "Article", plural: "Articles", icon: Newspaper, color: "var(--type-article)", text: "text-article" },
  image: { label: "Image", plural: "Images", icon: ImageIcon, color: "var(--type-image)", text: "text-image" },
  other: { label: "Link", plural: "Other", icon: Link2, color: "var(--type-other)", text: "text-other" },
};

export function TypeBadge({ type, className = "" }: { type: LinkType; className?: string }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md ${className}`}
      style={{
        color: m.color,
        borderColor: `color-mix(in oklab, ${m.color} 35%, transparent)`,
        background: `color-mix(in oklab, ${m.color} 14%, rgba(6,7,9,0.7))`,
      }}
    >
      <Icon className="size-3.5" aria-hidden strokeWidth={2.4} />
      {m.label}
    </span>
  );
}
