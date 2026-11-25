/** Shared scene geometry used by the rules layer and the Phaser renderer. */
export interface GameArenaGeometry {
  width: number;
  height: number;
  /** Y coordinate where new targets appear. */
  spawnY: number;
  /** Y coordinate of the spaceship's centre. */
  shipY: number;
  /**
   * A target is lost only after its lower edge passes this line. It sits below
   * the ship so targets can travel through the player's position first.
   */
  gameOverY: number;
}

export const MIN_ARENA_WIDTH = 280;
export const MIN_ARENA_HEIGHT = 240;
export const TARGET_HALF_HEIGHT = 18;
export const SHIP_CENTER_FROM_BOTTOM = 32;
export const SHIP_SCALE = 0.72;
export const SPAWN_TOP_Y = 28;

/**
 * Normalises container measurements into one geometry model. Keeping this in a
 * single pure function prevents the renderer, rules and DOM mirror from
 * disagreeing about where the ship and the game-over boundary are.
 */
export function getGameArenaGeometry(width: number, height: number): GameArenaGeometry {
  const safeWidth = Math.max(MIN_ARENA_WIDTH, Number.isFinite(width) ? width : MIN_ARENA_WIDTH);
  const safeHeight = Math.max(MIN_ARENA_HEIGHT, Number.isFinite(height) ? height : MIN_ARENA_HEIGHT);

  return {
    width: safeWidth,
    height: safeHeight,
    spawnY: SPAWN_TOP_Y,
    shipY: safeHeight - SHIP_CENTER_FROM_BOTTOM,
    gameOverY: safeHeight + TARGET_HALF_HEIGHT,
  };
}
