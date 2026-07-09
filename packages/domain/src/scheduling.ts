import type {
  Appointment,
  AppointmentInput,
  Clinic,
  ValidationError,
} from "./types";
import { toMinutes, formatTimeLabel } from "./time";

/** Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd). Touching edges do not overlap. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Find an existing appointment that would double-book the same sonographer.
 * Ignores the candidate itself (by id) so edits don't conflict with their own slot.
 */
export function findSonographerConflict(
  candidate: AppointmentInput,
  existing: readonly Appointment[],
): Appointment | undefined {
  const start = toMinutes(candidate.start);
  const end = toMinutes(candidate.end);
  return existing.find(
    (appt) =>
      appt.id !== candidate.id &&
      appt.sonographerId === candidate.sonographerId &&
      appt.date === candidate.date &&
      rangesOverlap(start, end, toMinutes(appt.start), toMinutes(appt.end)),
  );
}

/** True when the appointment fits entirely within the clinic's operating hours. */
export function isWithinOperatingHours(candidate: AppointmentInput, clinic: Clinic): boolean {
  return (
    toMinutes(candidate.start) >= toMinutes(clinic.opensAt) &&
    toMinutes(candidate.end) <= toMinutes(clinic.closesAt)
  );
}

/**
 * Validate an appointment against all scheduling rules.
 * Returns an empty array when the appointment is valid.
 */
export function validateAppointment(
  candidate: AppointmentInput,
  context: { clinics: readonly Clinic[]; existing: readonly Appointment[] },
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (toMinutes(candidate.end) <= toMinutes(candidate.start)) {
    errors.push({
      code: "INVALID_TIME_RANGE",
      message: "End time must be after start time.",
    });
    return errors; // downstream checks are meaningless for an inverted range
  }

  const clinic = context.clinics.find((c) => c.id === candidate.clinicId);
  if (!clinic) {
    errors.push({ code: "UNKNOWN_CLINIC", message: "Selected clinic does not exist." });
  } else if (!isWithinOperatingHours(candidate, clinic)) {
    errors.push({
      code: "OUTSIDE_OPERATING_HOURS",
      message: `${clinic.name} operates ${formatTimeLabel(clinic.opensAt)}–${formatTimeLabel(clinic.closesAt)}.`,
    });
  }

  const conflict = findSonographerConflict(candidate, context.existing);
  if (conflict) {
    errors.push({
      code: "DOUBLE_BOOKED",
      message: `Sonographer is already booked ${formatTimeLabel(conflict.start)}–${formatTimeLabel(conflict.end)} (${conflict.patientName}).`,
    });
  }

  return errors;
}
