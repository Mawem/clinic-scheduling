"use client";

import { useUiStore } from "@/stores/ui-store";
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog";
import { ScheduleBoard } from "./ScheduleBoard";
import { ScheduleHeader } from "./ScheduleHeader";

export function SchedulePage() {
  const dialog = useUiStore((state) => state.dialog);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-7xl flex-col px-4 pb-2 pt-5">
      <ScheduleHeader />
      <ScheduleBoard />
      {dialog ? <AppointmentDialog dialog={dialog} /> : null}
    </main>
  );
}
