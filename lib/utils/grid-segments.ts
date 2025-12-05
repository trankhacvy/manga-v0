/**
 * Grid Segment Utilities
 *
 * Calculate grid segments from layout templates and handle panel snapping
 */

import type { LayoutTemplate } from "@/types/layouts";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/page-dimensions";

export interface GridSegment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate grid segments from a layout template
 *
 * @param template - Layout template with panel definitions
 * @param pageWidth - Page width in pixels
 * @param pageHeight - Page height in pixels
 * @returns Array of grid segments
 */
export function calculateGridSegments(
  template: LayoutTemplate,
  pageWidth: number = DEFAULT_PAGE_SIZE.width,
  pageHeight: number = DEFAULT_PAGE_SIZE.height
): GridSegment[] {
  return template.panels.map((panel, index) => {
    const x = Math.round(panel.x * pageWidth);
    const y = Math.round(panel.y * pageHeight);
    const width = Math.round(panel.width * pageWidth);
    const height = Math.round(panel.height * pageHeight);

    return {
      id: `segment-${index}`,
      x,
      y,
      width,
      height,
      row: Math.floor(panel.y * 10), // Approximate row
      col: Math.floor(panel.x * 10), // Approximate col
      centerX: x + width / 2,
      centerY: y + height / 2,
    };
  });
}

/**
 * Find the closest grid segment to a panel's center
 *
 * @param panelX - Panel X position
 * @param panelY - Panel Y position
 * @param panelWidth - Panel width
 * @param panelHeight - Panel height
 * @param segments - Array of grid segments
 * @returns Closest segment and distance, or null if no segments
 */
export function findClosestSegment(
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
  segments: GridSegment[]
): { segment: GridSegment; distance: number } | null {
  if (segments.length === 0) return null;

  const panelCenterX = panelX + panelWidth / 2;
  const panelCenterY = panelY + panelHeight / 2;

  let closestSegment = segments[0];
  let minDistance = calculateDistance(
    panelCenterX,
    panelCenterY,
    closestSegment.centerX,
    closestSegment.centerY
  );

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const distance = calculateDistance(
      panelCenterX,
      panelCenterY,
      segment.centerX,
      segment.centerY
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestSegment = segment;
    }
  }

  return { segment: closestSegment, distance: minDistance };
}

/**
 * Calculate Euclidean distance between two points
 */
function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Snap threshold in pixels
 * If panel center is within this distance of segment center, snap to segment
 */
export const SNAP_THRESHOLD = 100;

/**
 * Check if panel should snap to a segment
 *
 * @param panelX - Panel X position
 * @param panelY - Panel Y position
 * @param panelWidth - Panel width
 * @param panelHeight - Panel height
 * @param segments - Array of grid segments
 * @param snapEnabled - Whether snapping is enabled (not holding Shift)
 * @returns Segment to snap to, or null if no snap
 */
export function shouldSnapToSegment(
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
  segments: GridSegment[],
  snapEnabled: boolean = true
): GridSegment | null {
  if (!snapEnabled || segments.length === 0) return null;

  const result = findClosestSegment(panelX, panelY, panelWidth, panelHeight, segments);
  
  if (!result) return null;

  // Only snap if within threshold
  if (result.distance <= SNAP_THRESHOLD) {
    return result.segment;
  }

  return null;
}

/**
 * Calculate snapped panel position and size
 *
 * @param segment - Grid segment to snap to
 * @returns Panel position and size that fits the segment
 */
export function calculateSnappedPosition(segment: GridSegment): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: segment.x,
    y: segment.y,
    width: segment.width,
    height: segment.height,
  };
}
