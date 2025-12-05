/**
 * Layout Template Type Definitions
 * 
 * This file defines the core types for the predefined layout system.
 * Layouts use relative positioning (0-1 scale) for responsive rendering.
 */

export type GridType = '1x1' | '2x1' | '2x2' | '2x3' | '3x2' | '3x3' | 'custom';

export type PanelType = 'standard' | 'splash' | 'inset' | 'borderless';

export type LayoutTag = 
  | 'action' 
  | 'dialogue' 
  | 'establishing' 
  | 'emotional'
  | 'dynamic'
  | 'conversation'
  | 'dramatic'
  | 'splash'
  | 'mixed';

/**
 * Panel margins in pixels
 */
export interface PanelMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Panel template with relative positioning (0-1 scale)
 * All positions are relative to the page's safe area
 */
export interface PanelTemplate {
  id: string;
  
  // Relative positioning (0 = left/top edge, 1 = right/bottom edge)
  x: number;      // 0-1: horizontal position
  y: number;      // 0-1: vertical position
  width: number;  // 0-1: percentage of page width
  height: number; // 0-1: percentage of page height
  
  // Visual properties
  zIndex: number;
  panelType: PanelType;
  
  // Spacing
  margins: PanelMargins;
}

/**
 * Complete layout template definition
 */
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  gridType: GridType;
  
  // Panel definitions
  panels: PanelTemplate[];
  
  // Metadata for AI selection
  tags: LayoutTag[];
  
  // Recommended use cases
  bestFor: string[];
  
  // Panel count this layout supports
  panelCount: number;
}

/**
 * Bubble template with relative positioning within panel
 */
export interface BubbleTemplate {
  id: string;
  
  // Position relative to panel (0-1 scale)
  relativeX: number;
  relativeY: number;
  relativeWidth: number;
  relativeHeight: number;
  
  // Bubble properties
  type: 'standard' | 'thought' | 'shout' | 'whisper' | 'narration';
  
  // Tail positioning
  tailDirection: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  tailTarget?: {
    relativeX: number;
    relativeY: number;
  };
}

/**
 * Page margins defining safe area
 */
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Absolute positioning (calculated from relative)
 */
export interface AbsolutePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Relative positioning (0-1 scale)
 */
export interface RelativePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Safe area bounds after applying page margins
 */
export interface SafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Rendered panel with both relative and absolute positions
 */
export interface RenderedPanel {
  id: string;
  panelIndex: number;
  
  // Relative positioning (stored in DB)
  relative: RelativePosition;
  
  // Absolute positioning (calculated for rendering)
  absolute: AbsolutePosition;
  
  // Visual properties
  zIndex: number;
  panelType: PanelType;
  margins: PanelMargins;
  borderStyle: string;
  borderWidth: number;
}

/**
 * Rendered bubble with absolute position
 */
export interface RenderedBubble {
  id: string;
  text: string;
  type: string;
  
  // Absolute position within page
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Tail properties
  tailDirection: string;
  tailTarget?: {
    x: number;
    y: number;
  };
}

/**
 * Complete rendered page
 */
export interface RenderedPage {
  pageId: string;
  width: number;
  height: number;
  margins: PageMargins;
  safeArea: SafeArea;
  layoutTemplateId: string;
  panels: RenderedPanel[];
}
