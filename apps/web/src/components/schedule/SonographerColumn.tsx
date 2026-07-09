"use client";

import type { Appointment, Clinic, Sonographer } from "@clinic-scheduling/domain";
import { toMinutes, toTimeString } from "@clinic-scheduling/domain";
import {
  DAY_END_MIN,
  DAY_START_MIN,
  durationToHeightPx,
  minutesToOffsetPx,
  SLOT_COUNT,
  SLOT_MIN,
  SLOT_PX,
} from "@/lib/constants";
import { AppointmentCard } from "./AppointmentCard";
import { SlotCell } from "./SlotCell";

interface SonographerColumnProps {
  sonographer: Sonographer;
  appointments: Appointment[];
  clinics: Clinic[];
  /** When a single clinic is selected, hours outside its schedule are shaded. */
  filteredClinic: Clinic | undefined;
  onCreateAt: (sonographerId: string, startMin: number) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

export function SonographerColumn({
  sonographer,
  appointments,
  clinics,
  filteredClinic,
  onCreateAt,
  onEdit,
  onDelete,
}: SonographerColumnProps) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => DAY_START_MIN + i * SLOT_MIN);

  const closedRanges: Array<{ from: number; to: number }> = [];
  if (filteredClinic) {
    const opens = toMinutes(filteredClinic.opensAt);
    const closes = toMinutes(filteredClinic.closesAt);
    if (opens > DAY_START_MIN) closedRanges.push({ from: DAY_START_MIN, to: opens });
    if (closes < DAY_END_MIN) closedRanges.push({ from: closes, to: DAY_END_MIN });
  }

  return (
    <div
      role="list"
      aria-label={`Appointments for ${sonographer.name}`}
      className="relative min-w-[150px] rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5"
      style={{ height: SLOT_COUNT * SLOT_PX }}
    >
      {slots.map((slotStartMin) => (
        <SlotCell
          key={slotStartMin}
          sonographerId={sonographer.id}
          sonographerName={sonographer.name}
          slotStartMin={slotStartMin}
          onCreate={() => onCreateAt(sonographer.id, slotStartMin)}
        />
      ))}

      {appointments.length === 0 && (
        <p className="pointer-events-none absolute inset-x-3 top-16 z-0 text-center text-xs text-slate-400">
          No appointments for {sonographer.name.split(" ")[0]} — select any open slot to add one.
        </p>
      )}

      {closedRanges.map((range) => (
        <div
          key={range.from}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-0 bg-slate-200/60"
          style={{
            top: minutesToOffsetPx(range.from),
            height: durationToHeightPx(range.from, range.to),
          }}
          title={`${filteredClinic?.name} closed ${toTimeString(range.from)}–${toTimeString(range.to)}`}
        />
      ))}

      {appointments.map((appointment) => (
        <div role="listitem" key={appointment.id} className="contents">
          <AppointmentCard
            appointment={appointment}
            clinic={clinics.find((c) => c.id === appointment.clinicId)}
            sonographer={sonographer}
            locked={Boolean(filteredClinic) && appointment.clinicId !== filteredClinic?.id}
            onEdit={() => onEdit(appointment)}
            onDelete={() => onDelete(appointment)}
          />
        </div>
      ))}
    </div>
  );
}
