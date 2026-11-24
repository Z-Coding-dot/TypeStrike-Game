import { describe, expect, it } from "vitest";
import {
  calculateAccuracy,
  calculateComboMultiplier,
  calculateWpm,
  formatDuration,
} from "@/game/utils/gameCalculations";

describe("gameCalculations", () => {
  it("calculates WPM from correct characters and the 5-character word rule", () => {
    expect(calculateWpm(5, 60_000)).toBe(1);
    expect(calculateWpm(50, 30_000)).toBe(20);
  });

  it("guards WPM against missing or invalid time", () => {
    expect(calculateWpm(0, 1_000)).toBe(0);
    expect(calculateWpm(10, 0)).toBe(0);
    expect(calculateWpm(10, -5)).toBe(0);
    expect(calculateWpm(Number.NaN, 1_000)).toBe(0);
  });

  it("derives accuracy from all printable attempts", () => {
    expect(calculateAccuracy(8, 2)).toBe(80);
    expect(calculateAccuracy(1, 1)).toBe(50);
    expect(calculateAccuracy(0, 0)).toBe(100);
    expect(calculateAccuracy(0, 5)).toBe(0);
  });

  it("caps the combo multiplier", () => {
    expect(calculateComboMultiplier(0)).toBe(1);
    expect(calculateComboMultiplier(1)).toBe(1.05);
    expect(calculateComboMultiplier(10)).toBe(1.5);
    expect(calculateComboMultiplier(1_000)).toBe(2);
    expect(calculateComboMultiplier(-4)).toBe(1);
  });

  it("formats elapsed time", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(600_000)).toBe("10:00");
    expect(formatDuration(3_661_000)).toBe("1:01:01");
  });
});
