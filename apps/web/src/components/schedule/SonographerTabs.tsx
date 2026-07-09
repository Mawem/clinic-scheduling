"use client";

import { clsx } from "clsx";
import type { Sonographer } from "@clinic-scheduling/domain";
import { sonographerColor } from "@/lib/constants";

interface SonographerTabsProps {
  sonographers: Sonographer[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** Mobile-only switcher: the board shows one sonographer at a time. */
export function SonographerTabs({ sonographers, activeId, onSelect }: SonographerTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Sonographer"
      className="mb-2 flex shrink-0 gap-1.5 overflow-x-auto pb-1"
    >
      {sonographers.map((sonographer) => {
        const colors = sonographerColor(sonographer.colorIndex);
        const active = sonographer.id === activeId;
        return (
          <button
            key={sonographer.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(sonographer.id)}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
              active
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
            )}
          >
            <span aria-hidden="true" className={clsx("size-2 rounded-full", colors.dot)} />
            {sonographer.name}
          </button>
        );
      })}
    </div>
  );
}
