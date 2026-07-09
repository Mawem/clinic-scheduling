import type { Appointment, AppointmentInput, Clinic, Sonographer } from "@clinic-scheduling/domain";
import { request } from "./client";

export function fetchClinics(): Promise<Clinic[]> {
  return request<Clinic[]>("/api/clinics");
}

export function fetchSonographers(): Promise<Sonographer[]> {
  return request<Sonographer[]>("/api/sonographers");
}

export function fetchAppointments(date: string): Promise<Appointment[]> {
  return request<Appointment[]>(`/api/appointments?date=${encodeURIComponent(date)}`);
}

export function createAppointment(input: AppointmentInput): Promise<Appointment> {
  return request<Appointment>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAppointment(
  id: string,
  patch: Partial<AppointmentInput>,
): Promise<Appointment> {
  return request<Appointment>(`/api/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteAppointment(id: string): Promise<void> {
  return request<void>(`/api/appointments/${id}`, { method: "DELETE" });
}
