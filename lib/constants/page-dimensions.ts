/**
 * Page Dimensions and Layout Constants
 * 
 * Standard manga/comic page sizes and spacing for the editor canvas
 */

/**
 * Standard manga page formats (in pixels at 300 DPI)
 */
export const PAGE_FORMATS = {
  // B5 format - most common for manga (182mm x 257mm at 300 DPI)
  B5: {
    width: 1654,
    height: 2339,
    name: 'B5 (Manga Standard)',
  },
  // A4 format - common for comics (210mm x 297mm at 300 DPI)
  A4: {
    width: 2480,
    height: 3508,
    name: 'A4 (Comic Standard)',
  },
  // US Letter - alternative format (8.5" x 11" at 300 DPI)
  LETTER: {
    width: 2550,
    height: 3300,
    name: 'US Letter',
  },
} as const;

/**
 * Default page size for new projects
 */
export const DEFAULT_PAGE_SIZE = PAGE_FORMATS.B5;

/**
 * Spacing between pages on the canvas (in pixels)
 */
export const PAGE_SPACING = 50;

/**
 * Page styling constants
 */
export const PAGE_STYLES = {
  // Page background color
  backgroundColor: '#ffffff',
  
  // Page border
  borderColor: '#000000', // gray-300
  borderWidth: 10,
  
  // Page shadow
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  
  // Page number label
  labelColor: '#6b7280', // gray-500
  labelFontSize: 14,
  labelFontFamily: 'Inter, system-ui, sans-serif',
  labelOffsetY: -30, // Position above page
  
  // Layout grid guides
  gridColor: '#000000', // gray-400
  gridStrokeWidth: 4,
  gridDashPattern: [8, 8], // Dashed line: 8px dash, 8px gap
} as const;

/**
 * Calculate Y offset for a page based on its index
 */
export function calculatePageYOffset(pageIndex: number): number {
  return pageIndex * (DEFAULT_PAGE_SIZE.height + PAGE_SPACING);
}

/**
 * Calculate total canvas height needed for N pages
 */
export function calculateTotalCanvasHeight(pageCount: number): number {
  if (pageCount === 0) return 0;
  return pageCount * DEFAULT_PAGE_SIZE.height + (pageCount - 1) * PAGE_SPACING;
}
