"use client";

import { useState } from "react";
import type {
  Appointment,
  AppointmentInput,
  Clinic,
  ExamType,
  Sonographer,
  ValidationError,
} from "@clinic-scheduling/domain";
import {
  EXAM_TYPES,
  formatTimeLabel,
  toMinutes,
  toTimeString,
  validateAppointment,
} from "@clinic-scheduling/domain";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";

const DURATIONS = [15, 30, 45, 60, 90];

interface AppointmentFormProps {
  clinics: Clinic[];
  sonographers: Sonographer[];
  /** Appointments used for client-side conflict pre-checks (current day's cache). */
  existing: Appointment[];
  initial: Partial<AppointmentInput>;
  /** Set when editing so validation ignores the appointment's own time slot. */
  editingId?: string;
  submitLabel: string;
  onSubmit: (input: AppointmentInput) => Promise<void>;
  onCancel: () => void;
  extraActions?: React.ReactNode;
}

const inputClasses =
  "w-full rounded-md bg-white px-2.5 py-1.5 text-sm ring-1 ring-slate-300 focus-visible:outline-2 focus-visible:outline-indigo-600";

export function AppointmentForm({
  clinics,
  sonographers,
  existing,
  initial,
  editingId,
  submitLabel,
  onSubmit,
  onCancel,
  extraActions,
}: AppointmentFormProps) {
  const [patientName, setPatientName] = useState(initial.patientName ?? "");
  const [examType, setExamType] = useState<ExamType>(initial.examType ?? EXAM_TYPES[0]!);
  const [clinicId, setClinicId] = useState(initial.clinicId ?? clinics[0]?.id ?? "");
  const [sonographerId, setSonographerId] = useState(
    initial.sonographerId ?? sonographers[0]?.id ?? "",
  );
  const [date, setDate] = useState(initial.date ?? "");
  const [start, setStart] = useState(initial.start ?? "09:00");
  const [duration, setDuration] = useState(() => {
    if (initial.start && initial.end) return toMinutes(initial.end) - toMinutes(initial.start);
    return 30;
  });
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedClinic = clinics.find((c) => c.id === clinicId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input: AppointmentInput = {
      id: editingId,
      patientName: patientName.trim(),
      examType,
      clinicId,
      sonographerId,
      date,
      start,
      end: toTimeString(toMinutes(start) + duration),
      notes: notes.trim() || undefined,
    };

    // Pre-check with the same domain rules the mock API enforces. `existing`
    // only covers the day on screen; cross-day conflicts are caught server-side.
    const clientErrors = validateAppointment(input, { clinics, existing });
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error) {
      if (error instanceof ApiError && error.errors.length > 0) {
        setErrors(error.errors);
      } else {
        setErrors([
          {
            code: "INVALID_TIME_RANGE",
            message: error instanceof Error ? error.message : "Something went wrong.",
          },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false} className="space-y-3">
      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.map((error) => (
            <li key={`${error.code}-${error.message}`}>{error.message}</li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor="appt-patient" className="mb-1 block text-sm font-medium text-slate-700">
          Patient name
        </label>
        <input
          id="appt-patient"
          required
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="appt-exam" className="mb-1 block text-sm font-medium text-slate-700">
            Exam type
          </label>
          <select
            id="appt-exam"
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            className={inputClasses}
          >
            {EXAM_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="appt-sonographer" className="mb-1 block text-sm font-medium text-slate-700">
            Sonographer
          </label>
          <select
            id="appt-sonographer"
            value={sonographerId}
            onChange={(e) => setSonographerId(e.target.value)}
            className={inputClasses}
          >
            {sonographers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="appt-clinic" className="mb-1 block text-sm font-medium text-slate-700">
          Clinic
        </label>
        <select
          id="appt-clinic"
          value={clinicId}
          onChange={(e) => setClinicId(e.target.value)}
          className={inputClasses}
          aria-describedby="appt-clinic-hours"
        >
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedClinic && (
          <p id="appt-clinic-hours" className="mt-1 text-xs text-slate-500">
            Operating hours: {formatTimeLabel(selectedClinic.opensAt)} –{" "}
            {formatTimeLabel(selectedClinic.closesAt)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="appt-date" className="mb-1 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="appt-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="appt-start" className="mb-1 block text-sm font-medium text-slate-700">
            Start
          </label>
          <input
            id="appt-start"
            type="time"
            required
            step={900}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="appt-duration" className="mb-1 block text-sm font-medium text-slate-700">
            Duration
          </label>
          <select
            id="appt-duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={inputClasses}
          >
            {DURATIONS.map((min) => (
              <option key={min} value={min}>
                {min} min
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="appt-notes" className="mb-1 block text-sm font-medium text-slate-700">
          Notes <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="appt-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div>{extraActions}</div>
        <div className="flex items-center gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
