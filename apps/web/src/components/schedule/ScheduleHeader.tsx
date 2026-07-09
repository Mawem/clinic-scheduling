"use client";

import { formatTimeLabel } from "@clinic-scheduling/domain";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLabel } from "@/lib/date";
import { useClinics } from "@/lib/queries";
import { useUiStore } from "@/stores/ui-store";

export function ScheduleHeader() {
  const { selectedDate, clinicFilter, setDate, shiftDate, goToToday, setClinicFilter, openCreateDialog } =
    useUiStore();
  const { data: clinics } = useClinics();
  const activeClinic = clinics?.find((c) => c.id === clinicFilter);
  const clinicOptions = [
    { value: "all", label: "All clinics" },
    ...(clinics ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const selectedOption = clinicOptions.find((o) => o.value === clinicFilter) ?? clinicOptions[0]!;

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
          <Combobox
            items={clinicOptions}
            value={selectedOption}
            onValueChange={(option) =>
              setClinicFilter((option as { value: string } | null)?.value ?? "all")
            }
          >
            <ComboboxInput
              id="clinic-filter"
              placeholder="Filter by clinic"
              className="w-48 bg-white"
            />
            <ComboboxContent>
              <ComboboxEmpty>No clinics found.</ComboboxEmpty>
              <ComboboxList>
                {(option: { value: string; label: string }) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

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
          clinics are locked while this filter is active.
        </p>
      ) : null}
    </header>
  );
}
