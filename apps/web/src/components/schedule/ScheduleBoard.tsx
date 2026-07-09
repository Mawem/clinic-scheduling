"use client";

import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Appointment } from "@clinic-scheduling/domain";
import { toMinutes, toTimeString, validateAppointment } from "@clinic-scheduling/domain";
import { BoardSkeleton } from "@/components/ui/BoardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useAppointments,
  useClinics,
  useDeleteAppointment,
  useSonographers,
  useUpdateAppointment,
} from "@/lib/queries";
import { useIsMobile } from "@/lib/useIsMobile";
import { toast } from "@/stores/toast-store";
import { useUiStore } from "@/stores/ui-store";
import { SonographerColumn } from "./SonographerColumn";
import { SonographerHeader } from "./SonographerHeader";
import { SonographerTabs } from "./SonographerTabs";
import { TimeGutter } from "./TimeGutter";
import type { SlotDropData } from "./SlotCell";

export function ScheduleBoard() {
  const {
    selectedDate,
    clinicFilter,
    activeSonographerId,
    setActiveSonographer,
    openCreateDialog,
    openEditDialog,
  } = useUiStore();
  const isMobile = useIsMobile();

  const clinicsQuery = useClinics();
  const sonographersQuery = useSonographers();
  const appointmentsQuery = useAppointments(selectedDate);

  const updateAppointment = useUpdateAppointment(selectedDate);
  const deleteAppointment = useDeleteAppointment(selectedDate);

  const sensors = useSensors(
    // The distance threshold keeps plain clicks (edit) distinct from drags (move).
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const isLoading =
    clinicsQuery.isPending || sonographersQuery.isPending || appointmentsQuery.isPending;
  const failedQuery = [clinicsQuery, sonographersQuery, appointmentsQuery].find((q) => q.isError);

  if (failedQuery) {
    return (
      <div className="min-h-0 flex-1">
        <ErrorState
          title="Couldn't load the schedule"
          detail={failedQuery.error instanceof Error ? failedQuery.error.message : undefined}
          onRetry={() => {
            for (const query of [clinicsQuery, sonographersQuery, appointmentsQuery]) {
              if (query.isError) void query.refetch();
            }
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-hidden">
        <BoardSkeleton />
      </div>
    );
  }

  const clinics = clinicsQuery.data ?? [];
  const sonographers = sonographersQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const filteredClinic = clinics.find((c) => c.id === clinicFilter);

  // On mobile the board shows a single sonographer, picked via the tab bar.
  const activeSonographer =
    sonographers.find((s) => s.id === activeSonographerId) ?? sonographers[0];
  const visibleSonographers =
    isMobile && activeSonographer ? [activeSonographer] : sonographers;

  function handleDragEnd(event: DragEndEvent) {
    const dropData = event.over?.data.current as SlotDropData | undefined;
    const appointment = event.active.data.current?.appointment as Appointment | undefined;
    if (!dropData || !appointment) return;

    const duration = toMinutes(appointment.end) - toMinutes(appointment.start);
    const candidate = {
      ...appointment,
      sonographerId: dropData.sonographerId,
      start: toTimeString(dropData.slotStartMin),
      end: toTimeString(dropData.slotStartMin + duration),
    };
    if (
      candidate.sonographerId === appointment.sonographerId &&
      candidate.start === appointment.start
    ) {
      return;
    }

    // Client-side pre-check gives instant feedback; the mock API re-validates
    // on PATCH and the optimistic update rolls back if it disagrees.
    const errors = validateAppointment(candidate, { clinics, existing: appointments });
    if (errors.length > 0) {
      toast.error(errors[0]!.message);
      return;
    }

    updateAppointment.mutate({
      id: appointment.id,
      patch: {
        sonographerId: candidate.sonographerId,
        start: candidate.start,
        end: candidate.end,
      },
    });
  }

  function handleCreateAt(sonographerId: string, startMin: number) {
    openCreateDialog({
      sonographerId,
      start: toTimeString(startMin),
      end: toTimeString(startMin + 30),
      date: selectedDate,
      clinicId: filteredClinic?.id,
    });
  }

  function handleDelete(appointment: Appointment) {
    if (window.confirm(`Delete the ${appointment.start} appointment for ${appointment.patientName}?`)) {
      deleteAppointment.mutate(appointment.id);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      {isMobile && activeSonographer ? (
        <SonographerTabs
          sonographers={sonographers}
          activeId={activeSonographer.id}
          onSelect={setActiveSonographer}
        />
      ) : null}
      {/* Single scroll container so the gutter (sticky left) and the column
          headers (sticky top) stay pinned on both axes. */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className="grid gap-x-2"
          style={{
            gridTemplateColumns: isMobile
              ? "48px minmax(0, 1fr)"
              : `56px repeat(${sonographers.length}, minmax(150px, 1fr))`,
          }}
        >
          <div aria-hidden="true" className="sticky left-0 top-0 z-40 bg-slate-100" />
          {visibleSonographers.map((sonographer) => (
            <div key={sonographer.id} className="sticky top-0 z-30 bg-slate-100 pb-2">
              <SonographerHeader sonographer={sonographer} />
            </div>
          ))}

          <div className="sticky left-0 z-20 bg-slate-100">
            <TimeGutter />
          </div>
          {visibleSonographers.map((sonographer) => (
            <SonographerColumn
              key={sonographer.id}
              sonographer={sonographer}
              appointments={appointments.filter((a) => a.sonographerId === sonographer.id)}
              clinics={clinics}
              filteredClinic={filteredClinic}
              onCreateAt={handleCreateAt}
              onEdit={(appointment) => openEditDialog(appointment.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
