/** Slow-drifting glow blobs behind content. Pure CSS, GPU-friendly (transform only). */
export function Aurora({ className = "", intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute -left-[10%] -top-[20%] h-[60vmax] w-[60vmax] animate-aurora rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(200,245,96,0.55), transparent 62%)", opacity: 0.28 * intensity }}
      />
      <div
        className="absolute -right-[15%] top-[5%] h-[55vmax] w-[55vmax] animate-aurora rounded-full blur-[120px] [animation-delay:-6s]"
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.55), transparent 62%)", opacity: 0.22 * intensity }}
      />
      <div
        className="absolute bottom-[-30%] left-[25%] h-[50vmax] w-[50vmax] animate-aurora rounded-full blur-[130px] [animation-delay:-12s]"
        style={{ background: "radial-gradient(circle, rgba(139,124,255,0.6), transparent 62%)", opacity: 0.2 * intensity }}
      />
    </div>
  );
}
