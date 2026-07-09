"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Appointment, AppointmentInput } from "@clinic-scheduling/domain";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  fetchClinics,
  fetchSonographers,
  updateAppointment,
} from "@/lib/api/endpoints";
import { toast } from "@/stores/toast-store";

export const queryKeys = {
  clinics: ["clinics"] as const,
  sonographers: ["sonographers"] as const,
  appointments: (date: string) => ["appointments", date] as const,
};

const OPTIMISTIC_ID_PREFIX = "optimistic-";

/**
 * True for appointments inserted optimistically that the server hasn't
 * confirmed yet. They render immediately but must not be edited, dragged, or
 * deleted — the server doesn't know their id.
 */
export function isOptimisticId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_ID_PREFIX);
}

export function useClinics() {
  return useQuery({ queryKey: queryKeys.clinics, queryFn: fetchClinics, staleTime: Infinity });
}

export function useSonographers() {
  return useQuery({
    queryKey: queryKeys.sonographers,
    queryFn: fetchSonographers,
    staleTime: Infinity,
  });
}

export function useAppointments(date: string) {
  return useQuery({
    queryKey: queryKeys.appointments(date),
    queryFn: () => fetchAppointments(date),
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/**
 * All mutations are optimistic: the cache is patched immediately, rolled back
 * on failure, and re-synced with the server on settle. `date` scopes which
 * day's cache gets patched (the day currently on screen).
 */
export function useCreateAppointment(date: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.appointments(date);
  return useMutation({
    mutationFn: (input: AppointmentInput) => createAppointment(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Appointment[]>(key);
      if (input.date === date) {
        const optimistic: Appointment = { ...input, id: `${OPTIMISTIC_ID_PREFIX}${Date.now()}` };
        queryClient.setQueryData<Appointment[]>(key, (old) => [...(old ?? []), optimistic]);
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: () => toast.success("Appointment created."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment(date: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.appointments(date);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AppointmentInput> }) =>
      updateAppointment(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Appointment[]>(key);
      queryClient.setQueryData<Appointment[]>(key, (old) =>
        old?.map((appt) => (appt.id === id ? { ...appt, ...patch } : appt)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment(date: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.appointments(date);
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Appointment[]>(key);
      queryClient.setQueryData<Appointment[]>(key, (old) => old?.filter((a) => a.id !== id));
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: () => toast.success("Appointment deleted."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
