"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useId, useState } from "react";

const clean = (t: string) =>
  t
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 32);

export function TagInput({
  value,
  onChange,
  suggestions,
  id,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const hintId = useId();

  const add = (raw: string) => {
    const t = clean(raw);
    if (t && !value.includes(t) && value.length < 12) onChange([...value, t]);
    setDraft("");
  };

  const matches = draft
    ? suggestions.filter((s) => s.startsWith(clean(draft)) && !value.includes(s)).slice(0, 5)
    : suggestions.filter((s) => !value.includes(s)).slice(0, 6);

  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-white/[0.03] px-2 py-2 transition-colors focus-within:border-lime/60 focus-within:bg-white/[0.05]">
        <AnimatePresence initial={false}>
          {value.map((t) => (
            <motion.span
              key={t}
              layout
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.12 } }}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 py-1 pl-2.5 pr-1 text-sm text-text"
            >
              #{t}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== t))}
                aria-label={`Remove tag ${t}`}
                className="grid size-6 place-items-center rounded-full hover:bg-white/15"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,\n]/.test(v)) v.split(/[,\n]/).forEach(add);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "Add another…" : "e.g. tutorial, design"}
          aria-describedby={hintId}
          className="min-w-28 flex-1 bg-transparent px-1.5 text-[15px] text-text outline-none placeholder:text-subtle"
          enterKeyHint="enter"
          autoCapitalize="none"
        />
      </div>
      <p id={hintId} className="mt-1.5 text-xs text-subtle">
        Press Enter or comma to add a tag.
      </p>
      {matches.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="min-h-8 rounded-full border border-line px-2.5 text-xs text-muted transition-colors hover:border-white/25 hover:text-text"
            >
              + #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
