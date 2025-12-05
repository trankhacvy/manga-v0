/**
 * Predefined Layout Templates
 * 
 * This file contains the core layout templates used for manga/comic page generation.
 * Each template defines panel positions using relative coordinates (0-1 scale).
 */

import type { LayoutTemplate, PanelTemplate } from '@/types/layouts';

/**
 * Standard panel margins (in pixels)
 */
const STANDARD_MARGINS = { top: 10, right: 10, bottom: 10, left: 10 };
const EDGE_MARGINS_LEFT = { top: 10, right: 5, bottom: 10, left: 10 };
const EDGE_MARGINS_RIGHT = { top: 10, right: 10, bottom: 10, left: 5 };
const EDGE_MARGINS_TOP = { top: 10, right: 10, bottom: 5, left: 10 };
const EDGE_MARGINS_BOTTOM = { top: 5, right: 10, bottom: 10, left: 10 };

/**
 * Layout 1: 4-Panel Dialogue (2x2 Grid)
 * Perfect for conversations and character interactions
 */
const DIALOGUE_4PANEL: LayoutTemplate = {
  id: 'dialogue-4panel',
  name: '4 Panel Dialogue',
  description: 'Classic 2x2 grid layout ideal for conversations',
  gridType: '2x2',
  panelCount: 4,
  tags: ['dialogue', 'conversation'],
  bestFor: ['Character dialogue', 'Back-and-forth conversations', 'Reaction shots'],
  panels: [
    {
      id: 'p1',
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p2',
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.5,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 10, bottom: 5, left: 5 },
    },
    {
      id: 'p3',
      x: 0,
      y: 0.5,
      width: 0.5,
      height: 0.5,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 10, left: 10 },
    },
    {
      id: 'p4',
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.5,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 10, left: 5 },
    },
  ],
};

/**
 * Layout 2: 6-Panel Action (2x3 Grid)
 * Dynamic layout for action sequences
 */
const ACTION_6PANEL: LayoutTemplate = {
  id: 'action-6panel',
  name: '6 Panel Action',
  description: 'Dynamic 2x3 grid for action sequences',
  gridType: '2x3',
  panelCount: 6,
  tags: ['action', 'dynamic'],
  bestFor: ['Action sequences', 'Fast-paced scenes', 'Movement'],
  panels: [
    {
      id: 'p1',
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.33,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p2',
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.33,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 10, bottom: 5, left: 5 },
    },
    {
      id: 'p3',
      x: 0,
      y: 0.33,
      width: 0.5,
      height: 0.34,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p4',
      x: 0.5,
      y: 0.33,
      width: 0.5,
      height: 0.34,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 5, left: 5 },
    },
    {
      id: 'p5',
      x: 0,
      y: 0.67,
      width: 0.5,
      height: 0.33,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 10, left: 10 },
    },
    {
      id: 'p6',
      x: 0.5,
      y: 0.67,
      width: 0.5,
      height: 0.33,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 10, left: 5 },
    },
  ],
};

/**
 * Layout 3: 3-Panel Establishing
 * Wide panels for establishing shots and dramatic moments
 */
const ESTABLISHING_3PANEL: LayoutTemplate = {
  id: 'establishing-3panel',
  name: '3 Panel Establishing',
  description: 'Wide horizontal panels for establishing shots',
  gridType: '3x2',
  panelCount: 3,
  tags: ['establishing', 'dramatic'],
  bestFor: ['Scene establishment', 'Landscape shots', 'Dramatic reveals'],
  panels: [
    {
      id: 'p1',
      x: 0,
      y: 0,
      width: 1.0,
      height: 0.33,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 10, bottom: 5, left: 10 },
    },
    {
      id: 'p2',
      x: 0,
      y: 0.33,
      width: 1.0,
      height: 0.34,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 5, left: 10 },
    },
    {
      id: 'p3',
      x: 0,
      y: 0.67,
      width: 1.0,
      height: 0.33,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 10, left: 10 },
    },
  ],
};

/**
 * Layout 4: Single Splash
 * Full-page panel for dramatic impact
 */
const SPLASH_SINGLE: LayoutTemplate = {
  id: 'splash-single',
  name: 'Single Splash',
  description: 'Full-page panel for maximum impact',
  gridType: '1x1',
  panelCount: 1,
  tags: ['splash', 'dramatic', 'emotional'],
  bestFor: ['Dramatic reveals', 'Key moments', 'Emotional peaks', 'Cover-worthy shots'],
  panels: [
    {
      id: 'p1',
      x: 0,
      y: 0,
      width: 1.0,
      height: 1.0,
      zIndex: 1,
      panelType: 'splash',
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
    },
  ],
};

/**
 * Layout 5: 5-Panel Mixed
 * Asymmetric layout with one large focus panel
 */
const MIXED_5PANEL: LayoutTemplate = {
  id: 'mixed-5panel',
  name: '5 Panel Mixed',
  description: 'Asymmetric layout with focus panel',
  gridType: 'custom',
  panelCount: 5,
  tags: ['mixed', 'dynamic', 'action'],
  bestFor: ['Action with focus', 'Key moment emphasis', 'Varied pacing'],
  panels: [
    // Top row: 2 small panels
    {
      id: 'p1',
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p2',
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 10, bottom: 5, left: 5 },
    },
    // Middle: 1 large focus panel
    {
      id: 'p3',
      x: 0,
      y: 0.25,
      width: 1.0,
      height: 0.5,
      zIndex: 2,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 5, left: 10 },
    },
    // Bottom row: 2 small panels
    {
      id: 'p4',
      x: 0,
      y: 0.75,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 10, left: 10 },
    },
    {
      id: 'p5',
      x: 0.5,
      y: 0.75,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 10, left: 5 },
    },
  ],
};

/**
 * Layout 6: 8-Panel Grid
 * Dense grid for detailed sequences
 */
const GRID_8PANEL: LayoutTemplate = {
  id: 'grid-8panel',
  name: '8 Panel Grid',
  description: 'Dense 4x2 grid for detailed sequences',
  gridType: '2x3',
  panelCount: 8,
  tags: ['dialogue', 'action', 'dynamic'],
  bestFor: ['Complex sequences', 'Multiple characters', 'Detailed action'],
  panels: [
    // Row 1
    {
      id: 'p1',
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p2',
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 10, right: 10, bottom: 5, left: 5 },
    },
    // Row 2
    {
      id: 'p3',
      x: 0,
      y: 0.25,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p4',
      x: 0.5,
      y: 0.25,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 5, left: 5 },
    },
    // Row 3
    {
      id: 'p5',
      x: 0,
      y: 0.5,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 5, left: 10 },
    },
    {
      id: 'p6',
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 5, left: 5 },
    },
    // Row 4
    {
      id: 'p7',
      x: 0,
      y: 0.75,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 5, bottom: 10, left: 10 },
    },
    {
      id: 'p8',
      x: 0.5,
      y: 0.75,
      width: 0.5,
      height: 0.25,
      zIndex: 1,
      panelType: 'standard',
      margins: { top: 5, right: 10, bottom: 10, left: 5 },
    },
  ],
};

/**
 * All available layout templates
 */
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  DIALOGUE_4PANEL,
  ACTION_6PANEL,
  ESTABLISHING_3PANEL,
  SPLASH_SINGLE,
  MIXED_5PANEL,
  GRID_8PANEL,
];

export const DEFAULT_LAYOUT_TEMPLATE: LayoutTemplate = ACTION_6PANEL;

/**
 * Get layout template by ID
 */
export function getLayoutById(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find(layout => layout.id === id);
}

/**
 * Get all available layouts
 */
export function getAllLayouts(): LayoutTemplate[] {
  return LAYOUT_TEMPLATES;
}

/**
 * Get layouts by panel count
 */
export function getLayoutsByPanelCount(count: number): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter(layout => layout.panelCount === count);
}

/**
 * Get layouts by tag
 */
export function getLayoutsByTag(tag: string): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter(layout => 
    layout.tags.includes(tag as any)
  );
}

/**
 * Get recommended layout for story context
 */
export function getRecommendedLayout(
  panelCount: number,
  storyBeat?: 'action' | 'dialogue' | 'establishing' | 'dramatic'
): LayoutTemplate {
  // Try to find exact panel count match with story beat
  if (storyBeat) {
    const matchingLayouts = LAYOUT_TEMPLATES.filter(
      layout => layout.panelCount === panelCount && layout.tags.includes(storyBeat as any)
    );
    if (matchingLayouts.length > 0) {
      return matchingLayouts[0];
    }
  }

  // Try to find exact panel count match
  const exactMatch = LAYOUT_TEMPLATES.find(layout => layout.panelCount === panelCount);
  if (exactMatch) {
    return exactMatch;
  }

  // Find closest panel count
  const sorted = [...LAYOUT_TEMPLATES].sort((a, b) => 
    Math.abs(a.panelCount - panelCount) - Math.abs(b.panelCount - panelCount)
  );

  return sorted[0];
}

/**
 * Default page margins (in pixels)
 */
export const DEFAULT_PAGE_MARGINS = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};
