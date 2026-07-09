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
  snapToSlot,
  toMinutes,
  toTimeString,
  validateAppointment,
} from "@clinic-scheduling/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";

const DURATIONS = [15, 30, 45, 60, 90];
const DURATION_ITEMS = Object.fromEntries(DURATIONS.map((min) => [String(min), `${min} min`]));
const EXAM_ITEMS = Object.fromEntries(EXAM_TYPES.map((type) => [type, type]));

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
  const clinicItems = Object.fromEntries(clinics.map((c) => [c.id, c.name]));
  const sonographerItems = Object.fromEntries(sonographers.map((s) => [s.id, s.name]));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Browsers don't reliably enforce the time input's step, so snap manual
    // entries (e.g. 9:07) onto the 15-minute grid the board renders.
    const startMin = snapToSlot(toMinutes(start), 15);
    setStart(toTimeString(startMin));
    const input: AppointmentInput = {
      id: editingId,
      patientName: patientName.trim(),
      examType,
      clinicId,
      sonographerId,
      date,
      start: toTimeString(startMin),
      end: toTimeString(startMin + duration),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.map((error) => (
            <li key={`${error.code}-${error.message}`}>{error.message}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="appt-patient">Patient name</Label>
        <Input
          id="appt-patient"
          required
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="appt-exam">Exam type</Label>
          <Select
            items={EXAM_ITEMS}
            value={examType}
            onValueChange={(value) => setExamType(value as ExamType)}
          >
            <SelectTrigger id="appt-exam" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="appt-sonographer">Sonographer</Label>
          <Select
            items={sonographerItems}
            value={sonographerId}
            onValueChange={(value) => setSonographerId(value as string)}
          >
            <SelectTrigger id="appt-sonographer" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sonographers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="appt-clinic">Clinic</Label>
        <Select
          items={clinicItems}
          value={clinicId}
          onValueChange={(value) => setClinicId(value as string)}
        >
          <SelectTrigger id="appt-clinic" className="w-full" aria-describedby="appt-clinic-hours">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clinics.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClinic && (
          <p id="appt-clinic-hours" className="text-xs text-muted-foreground">
            Operating hours: {formatTimeLabel(selectedClinic.opensAt)} –{" "}
            {formatTimeLabel(selectedClinic.closesAt)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="appt-date">Date</Label>
          <Input
            id="appt-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="appt-start">Start</Label>
          <Input
            id="appt-start"
            type="time"
            required
            step={900}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="appt-duration">Duration</Label>
          <Select
            items={DURATION_ITEMS}
            value={String(duration)}
            onValueChange={(value) => setDuration(Number(value))}
          >
            <SelectTrigger id="appt-duration" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((min) => (
                <SelectItem key={min} value={String(min)}>
                  {min} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="appt-notes">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="appt-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div>{extraActions}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
