"use client";

import { formatTimeLabel } from "@clinic-scheduling/domain";
import { Button } from "@/components/ui/Button";
import { formatDateLabel } from "@/lib/date";
import { useClinics } from "@/lib/queries";
import { useUiStore } from "@/stores/ui-store";

export function ScheduleHeader() {
  const { selectedDate, clinicFilter, setDate, shiftDate, goToToday, setClinicFilter, openCreateDialog } =
    useUiStore();
  const { data: clinics } = useClinics();
  const activeClinic = clinics?.find((c) => c.id === clinicFilter);

  return (
    <header className="mb-3 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Sonographer day board
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">{formatDateLabel(selectedDate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Date navigation">
            <Button onClick={() => shiftDate(-1)} aria-label="Previous day">
              ←
            </Button>
            <label className="sr-only" htmlFor="schedule-date">
              Schedule date
            </label>
            <input
              id="schedule-date"
              type="date"
              value={selectedDate}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="rounded-md bg-white px-2 py-1.5 text-sm ring-1 ring-slate-300 focus-visible:outline-2 focus-visible:outline-indigo-600"
            />
            <Button onClick={() => shiftDate(1)} aria-label="Next day">
              →
            </Button>
            <Button onClick={goToToday}>Today</Button>
          </div>

          <label className="sr-only" htmlFor="clinic-filter">
            Filter by clinic
          </label>
          <select
            id="clinic-filter"
            value={clinicFilter}
            onChange={(event) => setClinicFilter(event.target.value)}
            className="rounded-md bg-white px-2 py-1.5 text-sm ring-1 ring-slate-300 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <option value="all">All clinics</option>
            {clinics?.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>

          {/* On mobile the floating action button (SchedulePage) replaces this. */}
          <Button variant="primary" onClick={() => openCreateDialog()} className="max-sm:hidden">
            + New appointment
          </Button>
        </div>
      </div>

      {activeClinic ? (
        <p className="mt-2 text-sm text-slate-500">
          {activeClinic.name} operates {formatTimeLabel(activeClinic.opensAt)} –{" "}
          {formatTimeLabel(activeClinic.closesAt)}. Closed hours are shaded; appointments at other
          clinics are dimmed.
        </p>
      ) : null}
    </header>
  );
}
