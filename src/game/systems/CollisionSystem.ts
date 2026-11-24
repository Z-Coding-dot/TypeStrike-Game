export interface ScenePoint {
  x: number;
  y: number;
}

export interface ProjectileShape extends ScenePoint {
  radius?: number;
}

export interface TargetShape extends ScenePoint {
  halfWidth?: number;
  halfHeight?: number;
}

export interface SceneBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const DEFAULT_TARGET_HALF_WIDTH = 48;
const DEFAULT_TARGET_HALF_HEIGHT = 16;

/**
 * Targets travel downward toward the ship. A life is lost as soon as the
 * target's lower edge reaches the danger boundary.
 */
export function hasCrossedDangerBoundary(targetY: number, dangerY: number, halfHeight = 0): boolean {
  return targetY + Math.max(0, halfHeight) >= dangerY;
}

/** Finds every target that has just crossed (or is past) the danger line. */
export function findDangerTargets<T extends ScenePoint>(
  targets: readonly T[],
  dangerY: number,
  halfHeight = 0,
): T[] {
  return targets.filter((target) => hasCrossedDangerBoundary(target.y, dangerY, halfHeight));
}

/** Circle-versus-rectangle intersection for a projectile and a target label. */
export function projectileHitsTarget(
  projectile: ProjectileShape,
  target: TargetShape,
  defaultHalfWidth = DEFAULT_TARGET_HALF_WIDTH,
  defaultHalfHeight = DEFAULT_TARGET_HALF_HEIGHT,
): boolean {
  const halfWidth = target.halfWidth ?? defaultHalfWidth;
  const halfHeight = target.halfHeight ?? defaultHalfHeight;
  const radius = Math.max(0, projectile.radius ?? 0);

  const nearestX = clampNumber(projectile.x, target.x - halfWidth, target.x + halfWidth);
  const nearestY = clampNumber(projectile.y, target.y - halfHeight, target.y + halfHeight);

  const dx = projectile.x - nearestX;
  const dy = projectile.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

/** Whether a target is still inside the visible scene. */
export function isTargetWithinBounds(target: TargetShape, bounds: SceneBounds): boolean {
  const halfWidth = target.halfWidth ?? DEFAULT_TARGET_HALF_WIDTH;
  const halfHeight = target.halfHeight ?? DEFAULT_TARGET_HALF_HEIGHT;
  return (
    target.x - halfWidth >= bounds.left &&
    target.x + halfWidth <= bounds.right &&
    target.y - halfHeight >= bounds.top &&
    target.y + halfHeight <= bounds.bottom
  );
}

/** Horizontal lane centers, used by TargetManager to keep targets apart. */
export function calculateLaneCenters(width: number, laneCount: number, margin = 48): number[] {
  if (laneCount <= 0) return [];
  const safeWidth = Math.max(1, width);
  const safeMargin = Math.min(margin, safeWidth / 4);
  const laneWidth = (safeWidth - safeMargin * 2) / laneCount;
  return Array.from({ length: laneCount }, (_, index) => safeMargin + laneWidth * (index + 0.5));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
