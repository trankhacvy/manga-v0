/**
 * Simple Seed Script
 * 
 * Creates test data that can be used directly without database.
 * Useful for testing the rendering system in isolation.
 */

import type { PageModel, PanelModel } from '@/types/models';
import { getAllLayouts } from '@/lib/layout-templates';
import { DEFAULT_PAGE_MARGINS } from '@/lib/layout-templates';

export function createTestPage(
  layoutId: string,
  pageNumber: number = 1
): { page: PageModel; panels: PanelModel[] } {
  const layout = getAllLayouts().find(l => l.id === layoutId);
  
  if (!layout) {
    throw new Error(`Layout not found: ${layoutId}`);
  }

  const pageWidth = 1200;
  const pageHeight = 1800;
  const margins = DEFAULT_PAGE_MARGINS;
  
  const safeAreaWidth = pageWidth - margins.left - margins.right;
  const safeAreaHeight = pageHeight - margins.top - margins.bottom;

  // Create page
  const page: PageModel = {
    id: `test-page-${pageNumber}`,
    project_id: 'test-project',
    page_number: pageNumber,
    width: pageWidth,
    height: pageHeight,
    layout_template_id: layoutId,
    layout_type: null,
    margins: margins as any,
    story_beat: null,
    panel_count: layout.panelCount,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    layout_suggestion: null,
  };

  // Create panels from layout
  const panels: PanelModel[] = layout.panels.map((panelTemplate, index) => {
    // Calculate absolute positions
    const absoluteX = Math.round(
      margins.left + 
      panelTemplate.x * safeAreaWidth + 
      panelTemplate.margins.left
    );
    const absoluteY = Math.round(
      margins.top + 
      panelTemplate.y * safeAreaHeight + 
      panelTemplate.margins.top
    );
    const absoluteWidth = Math.round(
      panelTemplate.width * safeAreaWidth - 
      panelTemplate.margins.left - 
      panelTemplate.margins.right
    );
    const absoluteHeight = Math.round(
      panelTemplate.height * safeAreaHeight - 
      panelTemplate.margins.top - 
      panelTemplate.margins.bottom
    );

    return {
      id: `test-panel-${pageNumber}-${index}`,
      page_id: page.id,
      panel_index: index,
      x: absoluteX,
      y: absoluteY,
      width: absoluteWidth,
      height: absoluteHeight,
      relative_x: panelTemplate.x,
      relative_y: panelTemplate.y,
      relative_width: panelTemplate.width,
      relative_height: panelTemplate.height,
      z_index: panelTemplate.zIndex,
      panel_type: panelTemplate.panelType,
      border_style: 'solid',
      border_width: 2,
      panel_margins: panelTemplate.margins as any,
      image_url: null,
      prompt: `Panel ${index + 1}`,
      character_ids: [],
      character_handles: null,
      style_locks: null,
      bubbles: [],
      bubble_positions: null,
      sketch_url: null,
      controlnet_strength: null,
      generation_params: null,
      is_manually_edited: false,
      locked: false,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      character_positions: null,
    };
  });

  return { page, panels };
}

export function createTestPageWithBubbles(
  layoutId: string,
  pageNumber: number = 1
): { page: PageModel; panels: PanelModel[] } {
  const { page, panels } = createTestPage(layoutId, pageNumber);

  // Add sample bubbles to panels
  const sampleBubbles = [
    { text: 'Hello, world!', type: 'standard' },
    { text: '(I wonder what will happen...)', type: 'thought' },
    { text: 'WATCH OUT!', type: 'shout' },
    { text: 'shh... be quiet...', type: 'whisper' },
    { text: '[Meanwhile, at the castle...]', type: 'narration' },
  ];

  panels.forEach((panel, panelIndex) => {
    // Add 1-2 bubbles per panel
    const bubbleCount = Math.min(2, Math.floor(Math.random() * 3));
    const bubbles = [];

    for (let i = 0; i < bubbleCount; i++) {
      const sampleBubble = sampleBubbles[panelIndex % sampleBubbles.length];
      const relativeY = 0.1 + (i * 0.2);

      bubbles.push({
        id: `bubble-${panel.id}-${i}`,
        text: sampleBubble.text,
        type: sampleBubble.type,
        relativeX: 0.5,
        relativeY: relativeY,
        relativeWidth: 0.7,
        relativeHeight: 0.15,
        x: Math.round(panel.width * 0.15),
        y: Math.round(panel.height * relativeY),
        width: Math.round(panel.width * 0.7),
        height: Math.round(panel.height * 0.15),
      });
    }

    panel.bubbles = bubbles as any;
  });

  return { page, panels };
}

// Export all test pages
export function getAllTestPages(): Array<{ page: PageModel; panels: PanelModel[] }> {
  const layouts = getAllLayouts();
  return layouts.map((layout, index) => 
    createTestPageWithBubbles(layout.id, index + 1)
  );
}

// Example usage
// @ts-expect-error
if (require.main === module) {
  console.log('🧪 Creating test pages...\n');

  const testPages = getAllTestPages();

  testPages.forEach(({ page, panels }) => {
    console.log(`Page ${page.page_number}: ${page.layout_template_id}`);
    console.log(`  Dimensions: ${page.width}x${page.height}`);
    console.log(`  Panels: ${panels.length}`);
    panels.forEach(panel => {
      console.log(`    Panel ${panel.panel_index}: (${panel.x}, ${panel.y}) ${panel.width}x${panel.height}`);
      console.log(`      Relative: (${panel.relative_x}, ${panel.relative_y}) ${panel.relative_width}x${panel.relative_height}`);
      if (panel.bubbles && (panel.bubbles as any).length > 0) {
        console.log(`      Bubbles: ${(panel.bubbles as any).length}`);
      }
    });
    console.log('');
  });

  console.log(`✅ Created ${testPages.length} test pages`);
}
