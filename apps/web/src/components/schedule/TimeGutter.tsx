import { formatTimeLabel, toTimeString } from "@clinic-scheduling/domain";
import { DAY_END_MIN, DAY_START_MIN, SLOT_PX } from "@/lib/constants";

export function TimeGutter() {
  const hours: number[] = [];
  for (let min = DAY_START_MIN; min < DAY_END_MIN; min += 60) hours.push(min);

  return (
    <div aria-hidden="true" className="select-none">
      {hours.map((min) => (
        <div
          key={min}
          style={{ height: SLOT_PX * 4 }}
          className="pr-2 text-right text-xs leading-4 text-slate-400"
        >
          {formatTimeLabel(toTimeString(min))}
        </div>
      ))}
    </div>
  );
}
