import { describe, expect, it } from "vitest";
import type { Appointment, AppointmentInput, Clinic } from "../types";
import {
  findSonographerConflict,
  isWithinOperatingHours,
  rangesOverlap,
  validateAppointment,
} from "../scheduling";

const clinic: Clinic = {
  id: "c1",
  name: "Downtown Imaging",
  opensAt: "08:00",
  closesAt: "17:00",
};

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "a1",
    patientName: "Jane Doe",
    examType: "OB Ultrasound",
    clinicId: "c1",
    sonographerId: "s1",
    date: "2026-07-09",
    start: "09:00",
    end: "09:30",
    ...overrides,
  };
}

describe("rangesOverlap", () => {
  it("detects partial and full overlap", () => {
    expect(rangesOverlap(60, 120, 90, 150)).toBe(true); // partial
    expect(rangesOverlap(60, 120, 70, 80)).toBe(true); // containment
    expect(rangesOverlap(70, 80, 60, 120)).toBe(true); // contained by
    expect(rangesOverlap(60, 120, 60, 120)).toBe(true); // identical
  });

  it("treats touching edges as non-overlapping (back-to-back bookings allowed)", () => {
    expect(rangesOverlap(60, 120, 120, 180)).toBe(false);
    expect(rangesOverlap(120, 180, 60, 120)).toBe(false);
  });

  it("returns false for disjoint ranges", () => {
    expect(rangesOverlap(60, 90, 120, 150)).toBe(false);
  });
});

describe("findSonographerConflict", () => {
  const existing = [makeAppointment()];

  it("finds an overlap for the same sonographer on the same date", () => {
    const candidate: AppointmentInput = makeAppointment({ id: undefined, start: "09:15", end: "09:45" });
    expect(findSonographerConflict(candidate, existing)?.id).toBe("a1");
  });

  it("ignores other sonographers", () => {
    const candidate = makeAppointment({ id: undefined, sonographerId: "s2" });
    expect(findSonographerConflict(candidate, existing)).toBeUndefined();
  });

  it("ignores other dates", () => {
    const candidate = makeAppointment({ id: undefined, date: "2026-07-10" });
    expect(findSonographerConflict(candidate, existing)).toBeUndefined();
  });

  it("ignores the appointment being edited (self)", () => {
    const candidate = makeAppointment({ start: "09:00", end: "10:00" });
    expect(findSonographerConflict(candidate, existing)).toBeUndefined();
  });

  it("allows back-to-back bookings", () => {
    const candidate = makeAppointment({ id: undefined, start: "09:30", end: "10:00" });
    expect(findSonographerConflict(candidate, existing)).toBeUndefined();
  });
});

describe("isWithinOperatingHours", () => {
  it("accepts appointments inside hours, including exact boundaries", () => {
    expect(isWithinOperatingHours(makeAppointment({ start: "08:00", end: "08:30" }), clinic)).toBe(true);
    expect(isWithinOperatingHours(makeAppointment({ start: "16:30", end: "17:00" }), clinic)).toBe(true);
  });

  it("rejects appointments starting before opening or ending after closing", () => {
    expect(isWithinOperatingHours(makeAppointment({ start: "07:45", end: "08:15" }), clinic)).toBe(false);
    expect(isWithinOperatingHours(makeAppointment({ start: "16:45", end: "17:15" }), clinic)).toBe(false);
  });
});

describe("validateAppointment", () => {
  const context = { clinics: [clinic], existing: [makeAppointment()] };

  it("returns no errors for a valid appointment", () => {
    const candidate = makeAppointment({ id: undefined, start: "10:00", end: "10:30" });
    expect(validateAppointment(candidate, context)).toEqual([]);
  });

  it("rejects inverted or zero-length ranges without running other checks", () => {
    const candidate = makeAppointment({ id: undefined, start: "10:00", end: "10:00" });
    const errors = validateAppointment(candidate, context);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe("INVALID_TIME_RANGE");
  });

  it("flags unknown clinics", () => {
    const candidate = makeAppointment({ id: undefined, clinicId: "nope", start: "10:00", end: "10:30" });
    expect(validateAppointment(candidate, context).map((e) => e.code)).toContain("UNKNOWN_CLINIC");
  });

  it("flags appointments outside operating hours", () => {
    const candidate = makeAppointment({ id: undefined, start: "07:00", end: "07:30" });
    expect(validateAppointment(candidate, context).map((e) => e.code)).toContain(
      "OUTSIDE_OPERATING_HOURS",
    );
  });

  it("flags double-booking and includes the conflicting slot in the message", () => {
    const candidate = makeAppointment({ id: undefined, start: "09:15", end: "09:45" });
    const errors = validateAppointment(candidate, context);
    expect(errors.map((e) => e.code)).toContain("DOUBLE_BOOKED");
    expect(errors[0]?.message).toContain("9 AM");
  });

  it("can report hours and double-booking violations together", () => {
    const early = makeAppointment({ id: "a2", start: "07:00", end: "08:00" });
    const candidate = makeAppointment({ id: undefined, start: "07:30", end: "08:30" });
    const errors = validateAppointment(candidate, {
      clinics: [clinic],
      existing: [early],
    });
    expect(errors.map((e) => e.code).sort()).toEqual(["DOUBLE_BOOKED", "OUTSIDE_OPERATING_HOURS"]);
  });
});
