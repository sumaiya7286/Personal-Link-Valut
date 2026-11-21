/**
 * Calm, static backdrop: a few large, soft, low-saturation slate shapes.
 * No animation. It exists so frosted-glass panels have something gentle to blur.
 */
const SHAPES = [
  { pos: "-left-[15%] -top-[20%] h-[60vmax] w-[60vmax]", color: "100, 116, 139", opacity: 0.13 }, // slate
  { pos: "-right-[18%] top-[8%] h-[52vmax] w-[52vmax]", color: "88, 104, 128", opacity: 0.11 }, // blue-grey
  { pos: "bottom-[-30%] left-[20%] h-[48vmax] w-[48vmax]", color: "110, 120, 138", opacity: 0.09 }, // grey
];

export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {SHAPES.map((s) => (
        <div
          key={s.pos}
          className={`absolute rounded-full blur-[120px] ${s.pos}`}
          style={{ background: `radial-gradient(circle, rgb(${s.color}), transparent 65%)`, opacity: s.opacity }}
        />
      ))}
    </div>
  );
}
