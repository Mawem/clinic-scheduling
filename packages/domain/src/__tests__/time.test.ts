import { describe, expect, it } from "vitest";
import { formatTimeLabel, snapToSlot, toMinutes, toTimeString } from "../time";

describe("toMinutes", () => {
  it("converts HH:mm to minutes since midnight", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("08:30")).toBe(510);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it.each(["8:30", "08:60", "24:00", "abc", ""])("rejects malformed input %j", (input) => {
    expect(() => toMinutes(input)).toThrow();
  });
});

describe("toTimeString", () => {
  it("round-trips with toMinutes", () => {
    for (const time of ["00:00", "07:15", "12:00", "23:45"]) {
      expect(toTimeString(toMinutes(time))).toBe(time);
    }
  });
});

describe("snapToSlot", () => {
  it("snaps to the nearest 15-minute boundary", () => {
    expect(snapToSlot(0, 15)).toBe(0);
    expect(snapToSlot(7, 15)).toBe(0);
    expect(snapToSlot(8, 15)).toBe(15);
    expect(snapToSlot(52, 15)).toBe(45);
  });
});

describe("formatTimeLabel", () => {
  it("formats 12-hour labels", () => {
    expect(formatTimeLabel("00:00")).toBe("12 AM");
    expect(formatTimeLabel("08:00")).toBe("8 AM");
    expect(formatTimeLabel("12:00")).toBe("12 PM");
    expect(formatTimeLabel("13:30")).toBe("1:30 PM");
  });
});
