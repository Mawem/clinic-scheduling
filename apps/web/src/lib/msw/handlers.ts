import { delay, http, HttpResponse } from "msw";
import type { Appointment, AppointmentInput } from "@clinic-scheduling/domain";
import { validateAppointment } from "@clinic-scheduling/domain";
import * as db from "./db";
import { CLINICS, SONOGRAPHERS } from "./fixtures";

/** Simulated network latency; zero in tests so the suite stays fast. */
async function simulateLatency(): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  await delay(250 + Math.random() * 350);
}

/**
 * The mock API validates every write with the same domain rules the UI uses.
 * This mirrors a real backend: the client validates for UX, the server is the
 * source of truth. 409 = double-booking, 422 = other validation failures.
 */
function validationResponse(input: AppointmentInput) {
  const errors = validateAppointment(input, {
    clinics: CLINICS,
    existing: db.listByDate(input.date),
  });
  if (errors.length === 0) return null;
  const status = errors.some((e) => e.code === "DOUBLE_BOOKED") ? 409 : 422;
  return HttpResponse.json({ errors }, { status });
}

export const handlers = [
  http.get("*/api/clinics", async () => {
    await simulateLatency();
    return HttpResponse.json(CLINICS);
  }),

  http.get("*/api/sonographers", async () => {
    await simulateLatency();
    return HttpResponse.json(SONOGRAPHERS);
  }),

  http.get("*/api/appointments", async ({ request }) => {
    await simulateLatency();
    const date = new URL(request.url).searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return HttpResponse.json(
        { errors: [{ code: "BAD_REQUEST", message: "A date query param (YYYY-MM-DD) is required." }] },
        { status: 400 },
      );
    }
    return HttpResponse.json(db.listByDate(date));
  }),

  http.post("*/api/appointments", async ({ request }) => {
    await simulateLatency();
    const input = (await request.json()) as AppointmentInput;
    const invalid = validationResponse(input);
    if (invalid) return invalid;
    const appointment = db.insert({ ...input, id: db.nextId() });
    return HttpResponse.json(appointment, { status: 201 });
  }),

  http.patch("*/api/appointments/:id", async ({ request, params }) => {
    await simulateLatency();
    const id = params.id as string;
    const current = db.getById(id);
    if (!current) {
      return HttpResponse.json(
        { errors: [{ code: "NOT_FOUND", message: "Appointment not found." }] },
        { status: 404 },
      );
    }
    const patch = (await request.json()) as Partial<AppointmentInput>;
    const merged: Appointment = { ...current, ...patch, id };
    const invalid = validationResponse(merged);
    if (invalid) return invalid;
    return HttpResponse.json(db.update(id, merged));
  }),

  http.delete("*/api/appointments/:id", async ({ params }) => {
    await simulateLatency();
    if (!db.remove(params.id as string)) {
      return HttpResponse.json(
        { errors: [{ code: "NOT_FOUND", message: "Appointment not found." }] },
        { status: 404 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
