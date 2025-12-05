/**
 * Utility functions for speech bubble positioning
 */

export interface BubblePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RelativeBubblePosition {
  relativeX: number;
  relativeY: number;
  relativeWidth: number;
  relativeHeight: number;
}

/**
 * Validate bubble positions are within bounds
 */
export function validateBubblePosition(
  position: RelativeBubblePosition
): boolean {
  return (
    position.relativeX >= 0 &&
    position.relativeX <= 1 &&
    position.relativeY >= 0 &&
    position.relativeY <= 1 &&
    position.relativeWidth > 0 &&
    position.relativeWidth <= 1 &&
    position.relativeHeight > 0 &&
    position.relativeHeight <= 1 &&
    position.relativeX + position.relativeWidth <= 1 &&
    position.relativeY + position.relativeHeight <= 1
  );
}

/**
 * Calculate overlap between two bubbles (0 = no overlap, 1 = complete overlap)
 */
export function calculateOverlap(
  bubble1: RelativeBubblePosition,
  bubble2: RelativeBubblePosition
): number {
  const x1 = bubble1.relativeX;
  const y1 = bubble1.relativeY;
  const x2 = x1 + bubble1.relativeWidth;
  const y2 = y1 + bubble1.relativeHeight;

  const x3 = bubble2.relativeX;
  const y3 = bubble2.relativeY;
  const x4 = x3 + bubble2.relativeWidth;
  const y4 = y3 + bubble2.relativeHeight;

  // Calculate intersection
  const xOverlap = Math.max(0, Math.min(x2, x4) - Math.max(x1, x3));
  const yOverlap = Math.max(0, Math.min(y2, y4) - Math.max(y1, y3));
  const overlapArea = xOverlap * yOverlap;

  // Calculate areas
  const area1 = bubble1.relativeWidth * bubble1.relativeHeight;
  const area2 = bubble2.relativeWidth * bubble2.relativeHeight;
  const minArea = Math.min(area1, area2);

  return minArea > 0 ? overlapArea / minArea : 0;
}

/**
 * Adjust bubble positions to minimize overlap
 */
export function adjustForOverlap(
  bubbles: (RelativeBubblePosition & { id: string })[]
): (RelativeBubblePosition & { id: string })[] {
  const adjusted = [...bubbles];
  const maxIterations = 5;
  const overlapThreshold = 0.3; // 30% overlap is acceptable

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlap = false;

    for (let i = 0; i < adjusted.length; i++) {
      for (let j = i + 1; j < adjusted.length; j++) {
        const overlap = calculateOverlap(adjusted[i], adjusted[j]);

        if (overlap > overlapThreshold) {
          hasOverlap = true;

          // Move second bubble down slightly
          adjusted[j] = {
            ...adjusted[j],
            relativeY: Math.min(
              0.85 - adjusted[j].relativeHeight,
              adjusted[j].relativeY + 0.1
            ),
          };
        }
      }
    }

    if (!hasOverlap) break;
  }

  return adjusted;
}

/**
 * Convert relative positions to absolute pixel positions
 */
export function toAbsolutePosition(
  relative: RelativeBubblePosition,
  panelWidth: number,
  panelHeight: number
): BubblePosition {
  return {
    x: Math.round(panelWidth * relative.relativeX),
    y: Math.round(panelHeight * relative.relativeY),
    width: Math.round(panelWidth * relative.relativeWidth),
    height: Math.round(panelHeight * relative.relativeHeight),
  };
}

/**
 * Convert absolute positions to relative (0-1 scale)
 */
export function toRelativePosition(
  absolute: BubblePosition,
  panelWidth: number,
  panelHeight: number
): RelativeBubblePosition {
  return {
    relativeX: absolute.x / panelWidth,
    relativeY: absolute.y / panelHeight,
    relativeWidth: absolute.width / panelWidth,
    relativeHeight: absolute.height / panelHeight,
  };
}

/**
 * Estimate bubble size based on text length
 */
export function estimateBubbleSize(
  text: string,
  type: "dialogue" | "narration" | "thought"
): { width: number; height: number } {
  const charCount = text.length;
  
  // Narration boxes are typically wider and shorter
  if (type === "narration") {
    return {
      width: Math.min(0.8, Math.max(0.4, charCount / 80)),
      height: Math.min(0.15, Math.max(0.08, charCount / 200)),
    };
  }
  
  // Dialogue bubbles are more square
  const area = Math.max(0.08, Math.min(0.25, charCount / 100));
  const aspectRatio = 1.5; // Width is 1.5x height
  
  return {
    width: Math.sqrt(area * aspectRatio),
    height: Math.sqrt(area / aspectRatio),
  };
}
