"use client";

import { useUiStore } from "@/stores/ui-store";
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog";
import { ScheduleBoard } from "./ScheduleBoard";
import { ScheduleHeader } from "./ScheduleHeader";

export function SchedulePage() {
  const dialog = useUiStore((state) => state.dialog);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <ScheduleHeader />
      <ScheduleBoard />
      {dialog ? <AppointmentDialog dialog={dialog} /> : null}
    </main>
  );
}
