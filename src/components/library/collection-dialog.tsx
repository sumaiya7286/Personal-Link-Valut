"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Collection } from "@/lib/types";

export const COLLECTION_COLORS = ["#C8F560", "#2DD4BF", "#6CB8FF", "#8B7CFF", "#B9A6FF", "#FF7A6B", "#F5B860", "#FF8FC8"];

export function CollectionDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Collection | null;
  onSave: (name: string, color: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={editing ? "Edit collection" : "New collection"} size="sm">
      {open && <CollectionForm key={editing?.id ?? "new"} editing={editing} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function CollectionForm({
  editing,
  onClose,
  onSave,
}: {
  editing: Collection | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.color ?? COLLECTION_COLORS[0]);
  const [error, setError] = useState(false);
  const id = useId();

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError(true);
        onSave(name.trim().slice(0, 60), color);
        onClose();
      }}
      className="space-y-5"
    >
      <div>
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-muted">
          Name
        </label>
        <input
          id={id}
          data-autofocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(false);
          }}
          maxLength={60}
          placeholder="e.g. Tutorials, Work, Recipes"
          aria-invalid={error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="h-12 w-full rounded-2xl border border-line bg-white/[0.03] px-4 text-[15px] outline-none transition-colors placeholder:text-subtle focus:border-lime/60"
        />
        {error && (
          <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-danger">
            Give your collection a name.
          </p>
        )}
      </div>
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-muted">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLLECTION_COLORS.map((c) => (
            <label key={c} className="relative grid size-11 place-items-center rounded-full">
              <input
                type="radio"
                name="color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
                aria-label={`Color ${c}`}
              />
              <span
                className="size-8 rounded-full ring-offset-2 ring-offset-ink-900 transition-transform peer-checked:scale-110 peer-checked:ring-2 peer-focus-visible:ring-2 peer-focus-visible:ring-white"
                style={{ background: c, boxShadow: `0 0 18px -2px ${c}`, ["--tw-ring-color" as string]: c }}
              />
              {color === c && <Check className="pointer-events-none absolute size-4 text-black" aria-hidden strokeWidth={3} />}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {editing ? "Save" : "Create collection"}
        </Button>
      </div>
    </form>
  );
}
