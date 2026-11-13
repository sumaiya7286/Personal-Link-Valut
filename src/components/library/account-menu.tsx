"use client";

import { Download, LogOut, Upload } from "lucide-react";
import { Menu } from "@/components/ui/menu";
import { hueFor } from "@/lib/url";

export function AccountMenu({
  email,
  demo,
  onExport,
  onImport,
  onSignOut,
  side = "bottom",
  align = "end",
}: {
  email: string;
  demo: boolean;
  onExport: () => void;
  onImport: () => void;
  onSignOut: () => void;
  side?: "top" | "bottom";
  align?: "start" | "end";
}) {
  const hue = hueFor(email);
  const initial = demo ? "D" : (email.charAt(0) || "?").toUpperCase();
  return (
    <Menu
      side={side}
      align={align}
      header={
        <div className="mb-1 border-b border-line px-3 pb-2.5 pt-2">
          <p className="text-xs text-subtle">{demo ? "Demo mode" : "Signed in as"}</p>
          <p className="truncate text-sm font-medium text-text">{demo ? "Saved in this browser" : email}</p>
        </div>
      }
      items={[
        { label: "Export links", icon: Download, onSelect: onExport, hint: ".json" },
        { label: "Import links", icon: Upload, onSelect: onImport, hint: ".json / .html" },
        "separator",
        { label: demo ? "Exit demo" : "Sign out", icon: LogOut, onSelect: onSignOut },
      ]}
      trigger={(p) => (
        <button
          {...p}
          type="button"
          aria-label="Account menu"
          className="grid size-11 place-items-center rounded-full ring-1 ring-line transition-shadow hover:ring-line-strong"
        >
          <span
            className="grid size-8 place-items-center rounded-full font-display text-sm font-semibold text-black"
            style={{ background: `linear-gradient(135deg, hsl(${hue} 85% 72%), hsl(${(hue + 60) % 360} 80% 62%))` }}
          >
            {initial}
          </span>
        </button>
      )}
    />
  );
}
