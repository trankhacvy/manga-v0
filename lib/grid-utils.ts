/**
 * Utility functions for grid snapping and rendering
 */

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position (x, y) to the nearest grid point
 */
export function snapPositionToGrid(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

/**
 * Snap a rectangle (x, y, width, height) to the nearest grid points
 */
export function snapRectToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  gridSize: number
): { x: number; y: number; width: number; height: number } {
  const snappedX = snapToGrid(x, gridSize);
  const snappedY = snapToGrid(y, gridSize);
  const snappedWidth = snapToGrid(width, gridSize);
  const snappedHeight = snapToGrid(height, gridSize);

  return {
    x: snappedX,
    y: snappedY,
    width: Math.max(gridSize, snappedWidth), // Ensure minimum size
    height: Math.max(gridSize, snappedHeight),
  };
}

/**
 * Generate grid lines for rendering
 */
export function generateGridLines(
  width: number,
  height: number,
  gridSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): { vertical: number[]; horizontal: number[] } {
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // Calculate visible range with offset
  const startX = Math.floor(-offsetX / gridSize) * gridSize;
  const startY = Math.floor(-offsetY / gridSize) * gridSize;
  const endX = startX + width + gridSize;
  const endY = startY + height + gridSize;

  // Generate vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    vertical.push(x);
  }

  // Generate horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    horizontal.push(y);
  }

  return { vertical, horizontal };
}
