/**
 * PageRenderer Tests
 */

import { PageRenderer, relativeToAbsolute, absoluteToRelative } from '../page-renderer';
import type { PageModel, PanelModel } from '@/types/models';

describe('PageRenderer', () => {
  let renderer: PageRenderer;

  beforeEach(() => {
    renderer = new PageRenderer();
  });

  describe('applySafeArea', () => {
    it('should calculate safe area with margins', () => {
      const safeArea = renderer.applySafeArea(1200, 1800, {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      });

      expect(safeArea).toEqual({
        x: 20,
        y: 20,
        width: 1160,
        height: 1760,
      });
    });

    it('should handle asymmetric margins', () => {
      const safeArea = renderer.applySafeArea(1000, 1500, {
        top: 10,
        right: 30,
        bottom: 50,
        left: 20,
      });

      expect(safeArea).toEqual({
        x: 20,
        y: 10,
        width: 950,  // 1000 - 20 - 30
        height: 1440, // 1500 - 10 - 50
      });
    });
  });

  describe('calculateAbsolutePosition', () => {
    it('should convert relative to absolute position', () => {
      const absolute = renderer.calculateAbsolutePosition(
        { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        { x: 0, y: 0, width: 1000, height: 1000 }
      );

      expect(absolute).toEqual({
        x: 500,
        y: 500,
        width: 500,
        height: 500,
      });
    });

    it('should handle top-left position', () => {
      const absolute = renderer.calculateAbsolutePosition(
        { x: 0, y: 0, width: 0.5, height: 0.5 },
        { x: 20, y: 20, width: 1000, height: 1000 }
      );

      expect(absolute).toEqual({
        x: 20,
        y: 20,
        width: 500,
        height: 500,
      });
    });

    it('should handle full-width panel', () => {
      const absolute = renderer.calculateAbsolutePosition(
        { x: 0, y: 0, width: 1, height: 0.33 },
        { x: 0, y: 0, width: 1200, height: 1800 }
      );

      expect(absolute).toEqual({
        x: 0,
        y: 0,
        width: 1200,
        height: 594, // 1800 * 0.33
      });
    });
  });

  describe('renderPage', () => {
    it('should render page with panels', () => {
      const page: PageModel = {
        id: 'page-1',
        project_id: 'project-1',
        page_number: 1,
        width: 1200,
        height: 1800,
        layout_template_id: 'dialogue-4panel',
        layout_type: null,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        story_beat: null,
        panel_count: 4,
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        layout_suggestion: null,
      } as PageModel;

      const panels: PanelModel[] = [
        {
          id: 'panel-1',
          page_id: 'page-1',
          panel_index: 0,
          x: 0,
          y: 0,
          width: 600,
          height: 900,
          relative_x: 0,
          relative_y: 0,
          relative_width: 0.5,
          relative_height: 0.5,
          z_index: 1,
          panel_type: 'standard',
          border_style: 'solid',
          border_width: 2,
          panel_margins: { top: 10, right: 5, bottom: 5, left: 10 },
        } as PanelModel,
      ];

      const renderedPage = renderer.renderPage(page, panels);

      expect(renderedPage.pageId).toBe('page-1');
      expect(renderedPage.width).toBe(1200);
      expect(renderedPage.height).toBe(1800);
      expect(renderedPage.panels).toHaveLength(1);
      expect(renderedPage.panels[0].id).toBe('panel-1');
    });

    it('should throw error for invalid layout template', () => {
      const page: PageModel = {
        id: 'page-1',
        project_id: 'project-1',
        page_number: 1,
        width: 1200,
        height: 1800,
        layout_template_id: 'invalid-layout',
        layout_type: null,
        margins: null,
        story_beat: null,
        panel_count: 0,
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        layout_suggestion: null,
      } as PageModel;

      expect(() => renderer.renderPage(page, [])).toThrow();
    });
  });
});

describe('relativeToAbsolute', () => {
  it('should convert relative to absolute', () => {
    const absolute = relativeToAbsolute(
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      1000,
      1000,
      0,
      0
    );

    expect(absolute).toEqual({
      x: 500,
      y: 500,
      width: 500,
      height: 500,
    });
  });

  it('should handle offset', () => {
    const absolute = relativeToAbsolute(
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      1000,
      1000,
      100,
      200
    );

    expect(absolute).toEqual({
      x: 100,
      y: 200,
      width: 500,
      height: 500,
    });
  });
});

describe('absoluteToRelative', () => {
  it('should convert absolute to relative', () => {
    const relative = absoluteToRelative(
      { x: 500, y: 500, width: 500, height: 500 },
      1000,
      1000,
      0,
      0
    );

    expect(relative).toEqual({
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.5,
    });
  });

  it('should handle offset', () => {
    const relative = absoluteToRelative(
      { x: 100, y: 200, width: 500, height: 500 },
      1000,
      1000,
      100,
      200
    );

    expect(relative).toEqual({
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
    });
  });
});
