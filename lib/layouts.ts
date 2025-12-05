import type { LayoutTemplate } from "@/types";

export interface PanelCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  canvasWidth: number;
  canvasHeight: number;
  padding: number;
  gap: number;
}

// Default canvas configuration (standard manga page)
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  canvasWidth: 1200,
  canvasHeight: 1800,
  padding: 40,
  gap: 20,
};

/**
 * Calculate panel coordinates for 4-koma layout
 * Four equal vertical panels stacked on top of each other
 */
export function calculate4KomaLayout(
  panelCount: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): PanelCoordinates[] {
  const { canvasWidth, canvasHeight, padding, gap } = config;
  const actualPanelCount = Math.min(panelCount, 4); // 4-koma is always 4 panels

  const availableWidth = canvasWidth - padding * 2;
  const availableHeight =
    canvasHeight - padding * 2 - gap * (actualPanelCount - 1);
  const panelHeight = availableHeight / actualPanelCount;

  const coordinates: PanelCoordinates[] = [];

  for (let i = 0; i < actualPanelCount; i++) {
    coordinates.push({
      x: padding,
      y: padding + i * (panelHeight + gap),
      width: availableWidth,
      height: panelHeight,
    });
  }

  return coordinates;
}

/**
 * Calculate panel coordinates for action spread layout
 * One large focal panel with smaller supporting panels
 */
export function calculateActionSpreadLayout(
  panelCount: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): PanelCoordinates[] {
  const { canvasWidth, canvasHeight, padding, gap } = config;
  const actualPanelCount = Math.max(3, Math.min(panelCount, 5));

  const availableWidth = canvasWidth - padding * 2;
  const availableHeight = canvasHeight - padding * 2;

  const coordinates: PanelCoordinates[] = [];

  if (actualPanelCount === 3) {
    // Layout: Small panel top, large panel middle, small panel bottom
    const smallHeight = availableHeight * 0.25;
    const largeHeight = availableHeight * 0.5 - gap;

    coordinates.push(
      { x: padding, y: padding, width: availableWidth, height: smallHeight },
      {
        x: padding,
        y: padding + smallHeight + gap,
        width: availableWidth,
        height: largeHeight,
      },
      {
        x: padding,
        y: padding + smallHeight + largeHeight + gap * 2,
        width: availableWidth,
        height: smallHeight,
      }
    );
  } else if (actualPanelCount === 4) {
    // Layout: Two small panels top, one large panel middle, one small panel bottom
    const smallWidth = (availableWidth - gap) / 2;
    const smallHeight = availableHeight * 0.2;
    const largeHeight = availableHeight * 0.5 - gap * 2;

    coordinates.push(
      { x: padding, y: padding, width: smallWidth, height: smallHeight },
      {
        x: padding + smallWidth + gap,
        y: padding,
        width: smallWidth,
        height: smallHeight,
      },
      {
        x: padding,
        y: padding + smallHeight + gap,
        width: availableWidth,
        height: largeHeight,
      },
      {
        x: padding,
        y: padding + smallHeight + largeHeight + gap * 2,
        width: availableWidth,
        height: smallHeight,
      }
    );
  } else {
    // 5 panels: Two small top, one large middle, two small bottom
    const smallWidth = (availableWidth - gap) / 2;
    const smallHeight = availableHeight * 0.2;
    const largeHeight = availableHeight * 0.4 - gap * 2;

    coordinates.push(
      { x: padding, y: padding, width: smallWidth, height: smallHeight },
      {
        x: padding + smallWidth + gap,
        y: padding,
        width: smallWidth,
        height: smallHeight,
      },
      {
        x: padding,
        y: padding + smallHeight + gap,
        width: availableWidth,
        height: largeHeight,
      },
      {
        x: padding,
        y: padding + smallHeight + largeHeight + gap * 2,
        width: smallWidth,
        height: smallHeight,
      },
      {
        x: padding + smallWidth + gap,
        y: padding + smallHeight + largeHeight + gap * 2,
        width: smallWidth,
        height: smallHeight,
      }
    );
  }

  return coordinates;
}

/**
 * Calculate panel coordinates for standard grid layout
 * Flexible grid that adapts to panel count
 */
export function calculateStandardGridLayout(
  panelCount: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): PanelCoordinates[] {
  const { canvasWidth, canvasHeight, padding, gap } = config;
  const actualPanelCount = Math.max(1, Math.min(panelCount, 8));

  const availableWidth = canvasWidth - padding * 2;
  const availableHeight = canvasHeight - padding * 2;

  const coordinates: PanelCoordinates[] = [];

  // Determine grid layout based on panel count
  if (actualPanelCount === 1) {
    coordinates.push({
      x: padding,
      y: padding,
      width: availableWidth,
      height: availableHeight,
    });
  } else if (actualPanelCount === 2) {
    const panelHeight = (availableHeight - gap) / 2;
    coordinates.push(
      { x: padding, y: padding, width: availableWidth, height: panelHeight },
      {
        x: padding,
        y: padding + panelHeight + gap,
        width: availableWidth,
        height: panelHeight,
      }
    );
  } else if (actualPanelCount === 3) {
    const topHeight = availableHeight * 0.4;
    const bottomHeight = (availableHeight - topHeight - gap * 2) / 2;
    const bottomWidth = (availableWidth - gap) / 2;

    coordinates.push(
      { x: padding, y: padding, width: availableWidth, height: topHeight },
      {
        x: padding,
        y: padding + topHeight + gap,
        width: bottomWidth,
        height: bottomHeight,
      },
      {
        x: padding + bottomWidth + gap,
        y: padding + topHeight + gap,
        width: bottomWidth,
        height: bottomHeight,
      }
    );
  } else if (actualPanelCount === 4) {
    const panelWidth = (availableWidth - gap) / 2;
    const panelHeight = (availableHeight - gap) / 2;

    coordinates.push(
      { x: padding, y: padding, width: panelWidth, height: panelHeight },
      {
        x: padding + panelWidth + gap,
        y: padding,
        width: panelWidth,
        height: panelHeight,
      },
      {
        x: padding,
        y: padding + panelHeight + gap,
        width: panelWidth,
        height: panelHeight,
      },
      {
        x: padding + panelWidth + gap,
        y: padding + panelHeight + gap,
        width: panelWidth,
        height: panelHeight,
      }
    );
  } else if (actualPanelCount === 5) {
    const topWidth = (availableWidth - gap) / 2;
    const topHeight = availableHeight * 0.35;
    const bottomHeight = (availableHeight - topHeight - gap * 2) / 2;
    const bottomWidth = (availableWidth - gap * 2) / 3;

    coordinates.push(
      { x: padding, y: padding, width: topWidth, height: topHeight },
      {
        x: padding + topWidth + gap,
        y: padding,
        width: topWidth,
        height: topHeight,
      },
      {
        x: padding,
        y: padding + topHeight + gap,
        width: bottomWidth,
        height: bottomHeight,
      },
      {
        x: padding + bottomWidth + gap,
        y: padding + topHeight + gap,
        width: bottomWidth,
        height: bottomHeight,
      },
      {
        x: padding + bottomWidth * 2 + gap * 2,
        y: padding + topHeight + gap,
        width: bottomWidth,
        height: bottomHeight,
      }
    );
  } else if (actualPanelCount === 6) {
    const panelWidth = (availableWidth - gap * 2) / 3;
    const panelHeight = (availableHeight - gap) / 2;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        coordinates.push({
          x: padding + col * (panelWidth + gap),
          y: padding + row * (panelHeight + gap),
          width: panelWidth,
          height: panelHeight,
        });
      }
    }
  } else {
    // 7-8 panels: 3 rows with varying columns
    const panelWidth = (availableWidth - gap * 2) / 3;
    const panelHeight = (availableHeight - gap * 2) / 3;

    // First row: 3 panels
    for (let col = 0; col < 3; col++) {
      coordinates.push({
        x: padding + col * (panelWidth + gap),
        y: padding,
        width: panelWidth,
        height: panelHeight,
      });
    }

    // Second row: 3 panels
    for (let col = 0; col < 3; col++) {
      coordinates.push({
        x: padding + col * (panelWidth + gap),
        y: padding + panelHeight + gap,
        width: panelWidth,
        height: panelHeight,
      });
    }

    // Third row: remaining panels (1-2)
    const remainingPanels = actualPanelCount - 6;
    for (let i = 0; i < remainingPanels; i++) {
      coordinates.push({
        x: padding + i * (panelWidth + gap),
        y: padding + (panelHeight + gap) * 2,
        width: panelWidth,
        height: panelHeight,
      });
    }
  }

  return coordinates;
}

/**
 * Apply layout template to parsed panels
 */
export function applyLayoutTemplate(
  template: LayoutTemplate,
  panelCount: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): PanelCoordinates[] {
  switch (template) {
    case "4-koma":
      return calculate4KomaLayout(panelCount, config);
    case "action-spread":
      return calculateActionSpreadLayout(panelCount, config);
    case "standard-grid":
      return calculateStandardGridLayout(panelCount, config);
    case "custom":
      // For custom, use standard grid as base
      return calculateStandardGridLayout(panelCount, config);
    default:
      return calculateStandardGridLayout(panelCount, config);
  }
}
