"use client";

import { useUiStore } from "@/stores/ui-store";
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog";
import { ScheduleBoard } from "./ScheduleBoard";
import { ScheduleHeader } from "./ScheduleHeader";

export function SchedulePage() {
  const dialog = useUiStore((state) => state.dialog);
  const openCreateDialog = useUiStore((state) => state.openCreateDialog);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-7xl flex-col px-4 pb-2 pt-5">
      <ScheduleHeader />
      <ScheduleBoard />
      {dialog ? <AppointmentDialog dialog={dialog} /> : null}
      <button
        type="button"
        onClick={() => openCreateDialog()}
        aria-label="New appointment"
        className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-3xl font-light text-white shadow-lg hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:hidden"
      >
        +
      </button>
    </main>
  );
}
