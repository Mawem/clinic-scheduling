"use client";

import { useUiStore } from "@/stores/ui-store";
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog";
import { ScheduleBoard } from "./ScheduleBoard";
import { ScheduleHeader } from "./ScheduleHeader";

export function SchedulePage() {
  const dialog = useUiStore((state) => state.dialog);
  const openCreateDialog = useUiStore((state) => state.openCreateDialog);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-7xl flex-col px-5 pb-3 pt-5 sm:px-6 lg:px-8">
      <ScheduleHeader />
      <ScheduleBoard />
      {dialog ? <AppointmentDialog dialog={dialog} /> : null}
      <button
        type="button"
        onClick={() => openCreateDialog()}
        aria-label="New appointment"
        className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-3xl font-light text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden"
      >
        +
      </button>
    </main>
  );
}
