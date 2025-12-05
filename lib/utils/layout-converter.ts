/**
 * Layout Template Converter
 *
 * Converts relative panel positions (0-1 scale) from layout templates
 * to absolute pixel coordinates for rendering on the canvas.
 */

import type { LayoutTemplate, Panel } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants/page-dimensions";

/**
 * Convert a single panel template from relative to absolute coordinates
 *
 * @param relativeX - Horizontal position (0-1)
 * @param relativeY - Vertical position (0-1)
 * @param relativeWidth - Width as percentage (0-1)
 * @param relativeHeight - Height as percentage (0-1)
 * @param pageWidth - Page width in pixels
 * @param pageHeight - Page height in pixels
 * @returns Absolute coordinates {x, y, width, height}
 */
export function convertRelativeToAbsolute(
  relativeX: number,
  relativeY: number,
  relativeWidth: number,
  relativeHeight: number,
  pageWidth: number,
  pageHeight: number
) {
  return {
    x: Math.round(relativeX * pageWidth),
    y: Math.round(relativeY * pageHeight),
    width: Math.round(relativeWidth * pageWidth),
    height: Math.round(relativeHeight * pageHeight),
  };
}

/**
 * Convert a layout template to absolute panel positions
 *
 * @param template - Layout template with relative positions
 * @param pageWidth - Page width in pixels
 * @param pageHeight - Page height in pixels
 * @returns Array of absolute panel positions
 */
export function convertTemplateToAbsolute(
  template: LayoutTemplate,
  pageWidth: number = DEFAULT_PAGE_SIZE.width,
  pageHeight: number = DEFAULT_PAGE_SIZE.height
) {
  return template.panels.map((panelTemplate) => {
    const { x, y, width, height } = convertRelativeToAbsolute(
      panelTemplate.x,
      panelTemplate.y,
      panelTemplate.width,
      panelTemplate.height,
      pageWidth,
      pageHeight
    );

    return {
      x,
      y,
      width,
      height,
      panelType: panelTemplate.panelType,
      margins: panelTemplate.margins,
      zIndex: panelTemplate.zIndex,
    };
  });
}

/**
 * Generate panel records from a layout template
 *
 * @param template - Layout template to apply
 * @param pageId - ID of the page to add panels to
 * @param pageWidth - Page width in pixels
 * @param pageHeight - Page height in pixels
 * @returns Array of panel objects ready to be saved
 */
export function generatePanelsFromTemplate(
  template: LayoutTemplate,
  pageId: string,
  pageWidth: number = DEFAULT_PAGE_SIZE.width,
  pageHeight: number = DEFAULT_PAGE_SIZE.height
): Partial<Panel>[] {
  const absolutePositions = convertTemplateToAbsolute(
    template,
    pageWidth,
    pageHeight
  );

  return absolutePositions.map((pos, index) => ({
    pageId,
    panelIndex: index,
    x: pos.x,
    y: pos.y,
    width: pos.width,
    height: pos.height,
    imageUrl: "",
    prompt: "",
    characterHandles: [],
    styleLocks: [],
    bubbles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}
