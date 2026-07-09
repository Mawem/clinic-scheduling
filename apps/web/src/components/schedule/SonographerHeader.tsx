import { clsx } from "clsx";
import type { Sonographer } from "@clinic-scheduling/domain";
import { sonographerColor } from "@/lib/constants";

export function SonographerHeader({ sonographer }: { sonographer: Sonographer }) {
  const colors = sonographerColor(sonographer.colorIndex);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-900/5">
      <span aria-hidden="true" className={clsx("size-2.5 rounded-full", colors.dot)} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{sonographer.name}</p>
        <p className="truncate text-xs text-slate-500">{sonographer.credentials}</p>
      </div>
    </div>
  );
}
