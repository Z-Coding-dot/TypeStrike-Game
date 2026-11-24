import { describe, expect, it } from "vitest";
import {
  calculateLaneCenters,
  findDangerTargets,
  hasCrossedDangerBoundary,
  isTargetWithinBounds,
  projectileHitsTarget,
} from "@/game/systems/CollisionSystem";

describe("CollisionSystem", () => {
  it("detects targets crossing the danger boundary using their lower edge", () => {
    expect(hasCrossedDangerBoundary(380, 400, 18)).toBe(false);
    expect(hasCrossedDangerBoundary(382, 400, 18)).toBe(true);
    expect(hasCrossedDangerBoundary(405, 400)).toBe(true);
  });

  it("selects only targets that reached the danger line", () => {
    const targets = [
      { id: "safe", x: 100, y: 300 },
      { id: "danger", x: 100, y: 390 },
    ];
    expect(findDangerTargets(targets, 400, 16).map((target) => target.id)).toEqual(["danger"]);
  });

  it("detects projectile-to-target intersections", () => {
    const target = { x: 200, y: 120, halfWidth: 40, halfHeight: 12 };
    expect(projectileHitsTarget({ x: 200, y: 120, radius: 4 }, target)).toBe(true);
    expect(projectileHitsTarget({ x: 250, y: 120, radius: 4 }, target)).toBe(false);
    expect(projectileHitsTarget({ x: 244, y: 120, radius: 5 }, target)).toBe(true);
  });

  it("checks whether a target remains inside the scene", () => {
    const bounds = { left: 0, right: 800, top: 0, bottom: 600 };
    expect(isTargetWithinBounds({ x: 400, y: 300, halfWidth: 50, halfHeight: 20 }, bounds)).toBe(true);
    expect(isTargetWithinBounds({ x: 10, y: 300, halfWidth: 50, halfHeight: 20 }, bounds)).toBe(false);
  });

  it("allocates evenly spaced, distinct lanes", () => {
    const lanes = calculateLaneCenters(900, 3);
    expect(lanes).toHaveLength(3);
    expect(new Set(lanes.map((lane) => Math.round(lane))).size).toBe(3);
    expect(lanes[0]).toBeLessThan(lanes[1]);
    expect(lanes[1]).toBeLessThan(lanes[2]);
    expect(calculateLaneCenters(900, 0)).toEqual([]);
  });
});
