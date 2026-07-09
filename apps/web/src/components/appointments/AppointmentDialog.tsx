"use client";

import type { AppointmentInput } from "@clinic-scheduling/domain";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  useAppointments,
  useClinics,
  useCreateAppointment,
  useDeleteAppointment,
  useSonographers,
  useUpdateAppointment,
} from "@/lib/queries";
import { useUiStore, type DialogState } from "@/stores/ui-store";
import { AppointmentForm } from "./AppointmentForm";

export function AppointmentDialog({ dialog }: { dialog: DialogState }) {
  const { selectedDate, closeDialog } = useUiStore();

  const clinics = useClinics().data ?? [];
  const sonographers = useSonographers().data ?? [];
  const appointments = useAppointments(selectedDate).data ?? [];

  const createAppointment = useCreateAppointment(selectedDate);
  const updateAppointment = useUpdateAppointment(selectedDate);
  const deleteAppointment = useDeleteAppointment(selectedDate);

  const editing =
    dialog.mode === "edit" ? appointments.find((a) => a.id === dialog.appointmentId) : undefined;

  // The appointment may have been deleted (or the day changed) since opening.
  if (dialog.mode === "edit" && !editing) return null;
  if (clinics.length === 0 || sonographers.length === 0) return null;

  const initial: Partial<AppointmentInput> = editing ?? {
    date: selectedDate,
    start: "09:00",
    ...(dialog.mode === "create" ? dialog.defaults : undefined),
  };

  async function handleSubmit(input: AppointmentInput) {
    if (editing) {
      await updateAppointment.mutateAsync({ id: editing.id, patch: { ...input, id: undefined } });
    } else {
      await createAppointment.mutateAsync(input);
    }
    closeDialog();
  }

  function handleDelete() {
    if (!editing) return;
    if (window.confirm(`Delete the appointment for ${editing.patientName}?`)) {
      deleteAppointment.mutate(editing.id);
      closeDialog();
    }
  }

  return (
    <Dialog title={editing ? "Edit appointment" : "New appointment"} onClose={closeDialog}>
      <AppointmentForm
        clinics={clinics}
        sonographers={sonographers}
        existing={appointments}
        initial={initial}
        editingId={editing?.id}
        submitLabel={editing ? "Save changes" : "Create appointment"}
        onSubmit={handleSubmit}
        onCancel={closeDialog}
        extraActions={
          editing ? (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          ) : null
        }
      />
    </Dialog>
  );
}
