"use client";

import { useDroppable } from "@dnd-kit/core";
import { clsx } from "clsx";
import { formatTimeLabel, toTimeString } from "@clinic-scheduling/domain";
import { SLOT_MIN, SLOT_PX } from "@/lib/constants";

export interface SlotDropData {
  sonographerId: string;
  slotStartMin: number;
}

interface SlotCellProps {
  sonographerId: string;
  sonographerName: string;
  slotStartMin: number;
  onCreate: () => void;
}

export function SlotCell({ sonographerId, sonographerName, slotStartMin, onCreate }: SlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${sonographerId}:${slotStartMin}`,
    data: { sonographerId, slotStartMin } satisfies SlotDropData,
  });
  const isHourBoundary = (slotStartMin + SLOT_MIN) % 60 === 0;

  return (
    <button
      ref={setNodeRef}
      type="button"
      tabIndex={-1}
      onClick={onCreate}
      aria-label={`New appointment for ${sonographerName} at ${formatTimeLabel(toTimeString(slotStartMin))}`}
      style={{ height: SLOT_PX }}
      className={clsx(
        "block w-full border-b",
        isHourBoundary ? "border-slate-200" : "border-slate-100",
        isOver ? "bg-indigo-100" : "hover:bg-indigo-50/60",
      )}
    />
  );
}
