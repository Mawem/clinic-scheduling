import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Appointment, Clinic, Sonographer } from "@clinic-scheduling/domain";
import { AppointmentForm } from "../AppointmentForm";

const clinics: Clinic[] = [
  { id: "c1", name: "Downtown Imaging", opensAt: "08:00", closesAt: "17:00" },
];
const sonographers: Sonographer[] = [
  { id: "s1", name: "Alice Nguyen", credentials: "RDMS", colorIndex: 0 },
];
const existing: Appointment[] = [
  {
    id: "a1",
    patientName: "Booked Patient",
    examType: "Echocardiogram",
    clinicId: "c1",
    sonographerId: "s1",
    date: "2026-07-09",
    start: "09:00",
    end: "10:00",
  },
];

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <AppointmentForm
      clinics={clinics}
      sonographers={sonographers}
      existing={existing}
      initial={{ date: "2026-07-09", start: "10:00" }}
      submitLabel="Create appointment"
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );
  return onSubmit;
}

describe("AppointmentForm", () => {
  it("submits a valid appointment", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText("Patient name"), "New Patient");
    await user.click(screen.getByRole("button", { name: "Create appointment" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        patientName: "New Patient",
        start: "10:00",
        end: "10:30",
        date: "2026-07-09",
      }),
    );
  });

  it("blocks double-booked slots and explains the conflict", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText("Patient name"), "New Patient");
    const start = screen.getByLabelText("Start");
    await user.clear(start);
    await user.type(start, "09:30");
    await user.click(screen.getByRole("button", { name: "Create appointment" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/already booked/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks appointments outside clinic operating hours", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText("Patient name"), "Early Bird");
    const start = screen.getByLabelText("Start");
    await user.clear(start);
    await user.type(start, "07:00");
    await user.click(screen.getByRole("button", { name: "Create appointment" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/operates/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
