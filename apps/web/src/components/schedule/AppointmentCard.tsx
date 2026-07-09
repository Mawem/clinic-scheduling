"use client";

import { useDraggable } from "@dnd-kit/core";
import { clsx } from "clsx";
import { useEffect, useRef } from "react";
import type { Appointment, Clinic, Sonographer } from "@clinic-scheduling/domain";
import { formatTimeLabel, toMinutes } from "@clinic-scheduling/domain";
import { durationToHeightPx, minutesToOffsetPx, sonographerColor } from "@/lib/constants";
import { isOptimisticId } from "@/lib/queries";

interface AppointmentCardProps {
  appointment: Appointment;
  clinic: Clinic | undefined;
  sonographer: Sonographer;
  /** Filtered out by the clinic filter: shown for context but not modifiable. */
  locked: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function AppointmentCard({
  appointment,
  clinic,
  sonographer,
  locked,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment },
  });

  // A completed drag still fires a click on pointer-up; swallow that one so it
  // doesn't immediately open the edit dialog.
  const wasDragged = useRef(false);
  useEffect(() => {
    if (isDragging) wasDragged.current = true;
  }, [isDragging]);

  const startMin = toMinutes(appointment.start);
  const endMin = toMinutes(appointment.end);
  const colors = sonographerColor(sonographer.colorIndex);
  const timeLabel = `${formatTimeLabel(appointment.start)} – ${formatTimeLabel(appointment.end)}`;
  const compact = endMin - startMin < 45;
  // Awaiting server confirmation: visible for instant feedback, but inert —
  // the server can't act on an id it hasn't issued.
  const pending = isOptimisticId(appointment.id);
  // Inert cards render for context but accept no interaction at all.
  const inert = pending || locked;

  const stateHint = pending
    ? " Saving."
    : locked
      ? " Locked by the clinic filter — select this clinic or All clinics to edit."
      : " Press Enter to edit.";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(inert ? undefined : listeners)}
      tabIndex={inert ? -1 : attributes.tabIndex}
      onClick={() => {
        if (inert) return;
        if (wasDragged.current) {
          wasDragged.current = false;
          return;
        }
        onEdit();
      }}
      onKeyDown={(event) => {
        if (inert) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit();
        }
      }}
      aria-label={`${appointment.patientName}, ${appointment.examType}, ${timeLabel} at ${clinic?.name ?? "unknown clinic"} with ${sonographer.name}.${stateHint}`}
      aria-disabled={inert || undefined}
      style={{
        top: minutesToOffsetPx(startMin),
        height: durationToHeightPx(startMin, endMin),
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={clsx(
        // touch-manipulation (not touch-none) keeps swipe-to-scroll working;
        // the TouchSensor's long-press takes over only when drag activates.
        "group absolute inset-x-1 touch-manipulation overflow-hidden rounded-md px-2 py-1 text-left shadow-sm ring-1 ring-slate-900/5 transition-shadow",
        "focus-visible:outline-2 focus-visible:outline-indigo-600",
        colors.card,
        // Grab cursor and hover tint only when the card is actually interactive.
        !inert && ["cursor-grab", colors.cardHover],
        // Inert cards stay hit-testable so clicks don't fall through to the
        // slot underneath; the guarded handlers just ignore them.
        locked && "opacity-40",
        pending && "animate-pulse opacity-70",
        isDragging && "z-20 cursor-grabbing shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="truncate text-xs font-semibold text-slate-900">{appointment.patientName}</p>
        {!inert && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete appointment for ${appointment.patientName} at ${formatTimeLabel(appointment.start)}`}
            className="hidden shrink-0 rounded px-1 text-slate-400 hover:bg-white/70 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600 group-hover:block group-focus-within:block pointer-coarse:block"
          >
            ×
          </button>
        )}
      </div>
      {!compact && (
        <>
          <p className="truncate text-[11px] text-slate-600">
            {timeLabel} · {appointment.examType}
          </p>
          <p className="truncate text-[11px] text-slate-500">{clinic?.name}</p>
        </>
      )}
    </div>
  );
}
