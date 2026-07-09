"use client";

import { formatTimeLabel } from "@clinic-scheduling/domain";
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
import { formatDateLabel } from "@/lib/date";
import { useClinics } from "@/lib/queries";
import { useUiStore } from "@/stores/ui-store";

export function ScheduleHeader() {
  const { selectedDate, clinicFilter, setDate, shiftDate, goToToday, setClinicFilter, openCreateDialog } =
    useUiStore();
  const { data: clinics } = useClinics();
  const activeClinic = clinics?.find((c) => c.id === clinicFilter);
  const clinicItems = {
    all: "All clinics",
    ...Object.fromEntries((clinics ?? []).map((c) => [c.id, c.name])),
  };

  return (
    <header className="mb-4 shrink-0 sm:mb-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Sonographer day board
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">{formatDateLabel(selectedDate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Date navigation">
            <Button variant="outline" onClick={() => shiftDate(-1)} aria-label="Previous day">
              ←
            </Button>
            <Label className="sr-only" htmlFor="schedule-date">
              Schedule date
            </Label>
            <Input
              id="schedule-date"
              type="date"
              value={selectedDate}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="w-auto bg-white"
            />
            <Button variant="outline" onClick={() => shiftDate(1)} aria-label="Next day">
              →
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
          </div>

          <Label className="sr-only" htmlFor="clinic-filter">
            Filter by clinic
          </Label>
          <Select
            items={clinicItems}
            value={clinicFilter}
            onValueChange={(value) => setClinicFilter(value as string)}
          >
            <SelectTrigger id="clinic-filter" className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(clinicItems).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* On mobile the floating action button (SchedulePage) replaces this. */}
          <Button onClick={() => openCreateDialog()} className="max-sm:hidden">
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
