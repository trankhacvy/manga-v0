/**
 * Page Renderer
 * 
 * Converts relative positioning (0-1 scale) to absolute positioning (pixels)
 * for rendering manga/comic pages.
 */

import type { 
  PageModel, 
  PanelModel 
} from '@/types/models';
import type {
  SafeArea,
  AbsolutePosition,
  RelativePosition,
  RenderedPanel,
  RenderedPage,
  PageMargins,
} from '@/types/layouts';
import { getLayoutById, DEFAULT_PAGE_MARGINS } from '@/lib/layout-templates';

/**
 * Main PageRenderer class
 */
export class PageRenderer {
  /**
   * Render a complete page with all panels
   */
  renderPage(page: PageModel, panels: PanelModel[]): RenderedPage {
    // Get page dimensions
    const pageWidth = page.width || 1200;
    const pageHeight = page.height || 1800;
    
    // Get page margins
    const margins = this.getPageMargins(page);
    
    // Calculate safe area
    const safeArea = this.applySafeArea(pageWidth, pageHeight, margins);
    
    // Get layout template
    const layoutTemplateId = page.layout_template_id || 'dialogue-4panel';
    const layout = getLayoutById(layoutTemplateId);
    
    if (!layout) {
      throw new Error(`Layout template not found: ${layoutTemplateId}`);
    }
    
    // Sort panels by panel_index
    const sortedPanels = [...panels].sort((a, b) => a.panel_index - b.panel_index);
    
    // Render each panel
    const renderedPanels = sortedPanels.map((panel, index) => {
      return this.renderPanel(panel, index, layout.panels[index], safeArea);
    });
    
    return {
      pageId: page.id,
      width: pageWidth,
      height: pageHeight,
      margins,
      safeArea,
      layoutTemplateId,
      panels: renderedPanels,
    };
  }
  
  /**
   * Render a single panel
   */
  private renderPanel(
    panel: PanelModel,
    panelIndex: number,
    panelTemplate: any,
    safeArea: SafeArea
  ): RenderedPanel {
    // Get relative position from panel data or template
    const relative: RelativePosition = {
      x: panel.relative_x ?? panelTemplate?.x ?? 0,
      y: panel.relative_y ?? panelTemplate?.y ?? 0,
      width: panel.relative_width ?? panelTemplate?.width ?? 1,
      height: panel.relative_height ?? panelTemplate?.height ?? 1,
    };
    
    // Convert to absolute position
    const absolute = this.calculateAbsolutePosition(relative, safeArea);
    
    // Apply panel margins
    const panelMargins = this.getPanelMargins(panel, panelTemplate);
    const absoluteWithMargins = this.applyPanelMargins(absolute, panelMargins);
    
    return {
      id: panel.id,
      panelIndex,
      relative,
      absolute: absoluteWithMargins,
      zIndex: panel.z_index ?? panelTemplate?.zIndex ?? 1,
      panelType: (panel.panel_type as any) ?? panelTemplate?.panelType ?? 'standard',
      margins: panelMargins,
      borderStyle: panel.border_style ?? 'solid',
      borderWidth: panel.border_width ?? 2,
    };
  }
  
  /**
   * Calculate safe area after applying page margins
   */
  applySafeArea(
    pageWidth: number,
    pageHeight: number,
    margins: PageMargins
  ): SafeArea {
    return {
      x: margins.left,
      y: margins.top,
      width: pageWidth - margins.left - margins.right,
      height: pageHeight - margins.top - margins.bottom,
    };
  }
  
  /**
   * Convert relative position (0-1) to absolute position (pixels)
   */
  calculateAbsolutePosition(
    relative: RelativePosition,
    bounds: SafeArea
  ): AbsolutePosition {
    return {
      x: bounds.x + (relative.x * bounds.width),
      y: bounds.y + (relative.y * bounds.height),
      width: relative.width * bounds.width,
      height: relative.height * bounds.height,
    };
  }
  
  /**
   * Apply panel margins to absolute position
   */
  private applyPanelMargins(
    absolute: AbsolutePosition,
    margins: PageMargins
  ): AbsolutePosition {
    return {
      x: absolute.x + margins.left,
      y: absolute.y + margins.top,
      width: absolute.width - margins.left - margins.right,
      height: absolute.height - margins.top - margins.bottom,
    };
  }
  
  /**
   * Get page margins from page data or use defaults
   */
  private getPageMargins(page: PageModel): PageMargins {
    if (page.margins && typeof page.margins === 'object') {
      const m = page.margins as any;
      return {
        top: m.top ?? DEFAULT_PAGE_MARGINS.top,
        right: m.right ?? DEFAULT_PAGE_MARGINS.right,
        bottom: m.bottom ?? DEFAULT_PAGE_MARGINS.bottom,
        left: m.left ?? DEFAULT_PAGE_MARGINS.left,
      };
    }
    return DEFAULT_PAGE_MARGINS;
  }
  
  /**
   * Get panel margins from panel data or template
   */
  private getPanelMargins(panel: PanelModel, template: any): PageMargins {
    // Try panel-specific margins first
    if (panel.panel_margins && typeof panel.panel_margins === 'object') {
      const m = panel.panel_margins as any;
      return {
        top: m.top ?? 10,
        right: m.right ?? 10,
        bottom: m.bottom ?? 10,
        left: m.left ?? 10,
      };
    }
    
    // Fall back to template margins
    if (template?.margins) {
      return template.margins;
    }
    
    // Default margins
    return { top: 10, right: 10, bottom: 10, left: 10 };
  }
}

/**
 * Helper function to create a page renderer instance
 */
export function createPageRenderer(): PageRenderer {
  return new PageRenderer();
}

/**
 * Convenience function to render a page
 */
export function renderPage(page: PageModel, panels: PanelModel[]): RenderedPage {
  const renderer = new PageRenderer();
  return renderer.renderPage(page, panels);
}

/**
 * Calculate absolute position from relative (standalone utility)
 */
export function relativeToAbsolute(
  relative: RelativePosition,
  containerWidth: number,
  containerHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): AbsolutePosition {
  return {
    x: offsetX + (relative.x * containerWidth),
    y: offsetY + (relative.y * containerHeight),
    width: relative.width * containerWidth,
    height: relative.height * containerHeight,
  };
}

/**
 * Calculate relative position from absolute (standalone utility)
 */
export function absoluteToRelative(
  absolute: AbsolutePosition,
  containerWidth: number,
  containerHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): RelativePosition {
  return {
    x: (absolute.x - offsetX) / containerWidth,
    y: (absolute.y - offsetY) / containerHeight,
    width: absolute.width / containerWidth,
    height: absolute.height / containerHeight,
  };
}
