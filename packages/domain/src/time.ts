/** Convert "HH:mm" to minutes since midnight. Throws on malformed input. */
export function toMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Invalid time string: "${time}"`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid time string: "${time}"`);
  return hours * 60 + minutes;
}

/** Convert minutes since midnight to "HH:mm". */
export function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Snap minutes to the nearest slot boundary (e.g. 15-minute grid). */
export function snapToSlot(minutes: number, slotSize: number): number {
  return Math.round(minutes / slotSize) * slotSize;
}

/** Human-friendly 12-hour label, e.g. "1:30 PM". */
export function formatTimeLabel(time: string): string {
  const total = toMinutes(time);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
