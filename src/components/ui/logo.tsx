import Link from "next/link";

/**
 * The fill lives in CSS (not an SVG <linearGradient>), so the mark renders even when
 * another copy of the logo sits inside a display:none container (duplicate SVG ids break that).
 */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-grid shrink-0 place-items-center rounded-[28%] bg-lime ${className}`}
    >
      <svg viewBox="0 0 32 32" className="size-full">
        {/* Three stacked cards, the top one tilted: links being stashed */}
        <rect x="8" y="17.5" width="16" height="5" rx="2.5" fill="#0B0E05" opacity="0.35" />
        <rect x="8" y="12.5" width="16" height="5" rx="2.5" fill="#0B0E05" opacity="0.6" />
        <rect x="8" y="6.5" width="16" height="5" rx="2.5" fill="#0B0E05" transform="rotate(-8 16 9)" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 rounded-xl" aria-label="Stash home">
      <LogoMark className="size-8 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-105" />
      <span className="font-display text-xl font-semibold tracking-tight">Stash</span>
    </Link>
  );
}
