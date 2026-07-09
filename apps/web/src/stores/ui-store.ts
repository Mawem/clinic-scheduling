import { create } from "zustand";
import type { AppointmentInput } from "@clinic-scheduling/domain";
import { addDaysISO, todayISO } from "@/lib/date";

export type DialogState =
  | { mode: "create"; defaults?: Partial<AppointmentInput> }
  | { mode: "edit"; appointmentId: string };

interface UiState {
  selectedDate: string;
  clinicFilter: string | "all";
  /** Which sonographer's column is shown on mobile (null = first). */
  activeSonographerId: string | null;
  dialog: DialogState | null;
  setDate: (date: string) => void;
  shiftDate: (days: number) => void;
  goToToday: () => void;
  setClinicFilter: (clinicId: string | "all") => void;
  setActiveSonographer: (id: string) => void;
  openCreateDialog: (defaults?: Partial<AppointmentInput>) => void;
  openEditDialog: (appointmentId: string) => void;
  closeDialog: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedDate: todayISO(),
  clinicFilter: "all",
  activeSonographerId: null,
  dialog: null,
  setDate: (date) => set({ selectedDate: date }),
  shiftDate: (days) => set((state) => ({ selectedDate: addDaysISO(state.selectedDate, days) })),
  goToToday: () => set({ selectedDate: todayISO() }),
  setClinicFilter: (clinicId) => set({ clinicFilter: clinicId }),
  setActiveSonographer: (id) => set({ activeSonographerId: id }),
  openCreateDialog: (defaults) => set({ dialog: { mode: "create", defaults } }),
  openEditDialog: (appointmentId) => set({ dialog: { mode: "edit", appointmentId } }),
  closeDialog: () => set({ dialog: null }),
}));
