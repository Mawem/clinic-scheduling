import { describe, expect, it } from "vitest";
import type { AppointmentInput } from "@clinic-scheduling/domain";
import { ApiError } from "@/lib/api/client";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  fetchClinics,
  updateAppointment,
} from "@/lib/api/endpoints";

/**
 * Exercises the real API client against the mock REST API (msw/node), i.e. the
 * exact request/response path the app uses in the browser. A synthetic
 * sonographer id keeps conflict checks independent of the seeded demo data.
 */

const DATE = "2026-07-09";

function makeInput(overrides: Partial<AppointmentInput> = {}): AppointmentInput {
  return {
    patientName: "Test Patient",
    examType: "OB Ultrasound",
    clinicId: "northgate",
    sonographerId: "s-test",
    date: DATE,
    start: "16:00",
    end: "16:30",
    ...overrides,
  };
}

describe("mock REST API", () => {
  it("lists clinics", async () => {
    const clinics = await fetchClinics();
    expect(clinics.length).toBeGreaterThan(0);
    expect(clinics[0]).toMatchObject({ id: expect.any(String), opensAt: expect.any(String) });
  });

  it("creates, updates, and deletes an appointment", async () => {
    const created = await createAppointment(makeInput());
    expect(created.id).toBeTruthy();

    const updated = await updateAppointment(created.id, { start: "16:30", end: "17:00" });
    expect(updated.start).toBe("16:30");

    await deleteAppointment(created.id);
    const remaining = await fetchAppointments(DATE);
    expect(remaining.find((a) => a.id === created.id)).toBeUndefined();
  });

  it("rejects double-booking with a 409 and a descriptive error", async () => {
    await createAppointment(makeInput({ start: "16:00", end: "17:00" }));

    const attempt = createAppointment(
      makeInput({ start: "16:30", end: "17:00", patientName: "Overlap" }),
    );
    await expect(attempt).rejects.toThrowError(ApiError);
    await expect(
      createAppointment(makeInput({ start: "16:30", end: "17:00", patientName: "Overlap" })),
    ).rejects.toMatchObject({
      status: 409,
      errors: [expect.objectContaining({ code: "DOUBLE_BOOKED" })],
    });
  });

  it("allows the same time slot for a different sonographer", async () => {
    await createAppointment(makeInput({ start: "16:00", end: "17:00" }));
    const other = await createAppointment(
      makeInput({ sonographerId: "s-test-2", start: "16:00", end: "17:00" }),
    );
    expect(other.id).toBeTruthy();
  });

  it("rejects appointments outside clinic operating hours with a 422", async () => {
    await expect(
      createAppointment(makeInput({ clinicId: "downtown", start: "17:30", end: "18:00" })),
    ).rejects.toMatchObject({
      status: 422,
      errors: [expect.objectContaining({ code: "OUTSIDE_OPERATING_HOURS" })],
    });
  });

  it("rejects moves (PATCH) that would double-book", async () => {
    const a = await createAppointment(makeInput({ start: "14:00", end: "14:30" }));
    await createAppointment(makeInput({ start: "15:00", end: "15:30" }));

    await expect(updateAppointment(a.id, { start: "15:00", end: "15:30" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("returns 404 for unknown appointment ids", async () => {
    await expect(updateAppointment("missing", { start: "10:00" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
