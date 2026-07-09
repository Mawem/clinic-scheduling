/** Visible day range on the board: 7:00 AM to 7:00 PM in 15-minute slots. */
export const DAY_START_MIN = 7 * 60;
export const DAY_END_MIN = 19 * 60;
export const SLOT_MIN = 15;
export const SLOT_PX = 18;
export const SLOT_COUNT = (DAY_END_MIN - DAY_START_MIN) / SLOT_MIN;

export function minutesToOffsetPx(minutes: number): number {
  return ((minutes - DAY_START_MIN) / SLOT_MIN) * SLOT_PX;
}

export function durationToHeightPx(startMin: number, endMin: number): number {
  return ((endMin - startMin) / SLOT_MIN) * SLOT_PX;
}

/** Full literal class strings so Tailwind's scanner picks them up. */
export const SONOGRAPHER_COLORS = [
  { card: "border-l-sky-500 bg-sky-50 hover:bg-sky-100", dot: "bg-sky-500" },
  { card: "border-l-violet-500 bg-violet-50 hover:bg-violet-100", dot: "bg-violet-500" },
  { card: "border-l-emerald-500 bg-emerald-50 hover:bg-emerald-100", dot: "bg-emerald-500" },
  { card: "border-l-amber-500 bg-amber-50 hover:bg-amber-100", dot: "bg-amber-500" },
] as const;

export function sonographerColor(colorIndex: number) {
  return SONOGRAPHER_COLORS[colorIndex % SONOGRAPHER_COLORS.length]!;
}
