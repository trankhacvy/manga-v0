-- Migration: Add Layout Template Support
-- This migration adds fields to support the predefined layout template system
-- with relative positioning (0-1 scale) for responsive rendering

-- ============================================================================
-- PAGES TABLE UPDATES
-- ============================================================================

-- Add layout template reference and page margins
ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS layout_template_id TEXT,
  ADD COLUMN IF NOT EXISTS margins JSONB DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}'::jsonb;

COMMENT ON COLUMN pages.layout_template_id IS 'Reference to predefined layout template (e.g., dialogue-4panel, action-6panel)';
COMMENT ON COLUMN pages.margins IS 'Page margins in pixels defining safe area: {top, right, bottom, left}';

-- ============================================================================
-- PANELS TABLE UPDATES
-- ============================================================================

-- Add relative positioning fields (0-1 scale)
ALTER TABLE panels
  ADD COLUMN IF NOT EXISTS relative_x DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS relative_y DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS relative_width DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS relative_height DECIMAL(5,4);

COMMENT ON COLUMN panels.relative_x IS 'Relative X position (0-1 scale, 0=left edge, 1=right edge)';
COMMENT ON COLUMN panels.relative_y IS 'Relative Y position (0-1 scale, 0=top edge, 1=bottom edge)';
COMMENT ON COLUMN panels.relative_width IS 'Relative width (0-1 scale, percentage of page width)';
COMMENT ON COLUMN panels.relative_height IS 'Relative height (0-1 scale, percentage of page height)';

-- Add visual properties
ALTER TABLE panels
  ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS panel_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS border_style TEXT DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS border_width INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS panel_margins JSONB DEFAULT '{"top": 10, "right": 10, "bottom": 10, "left": 10}'::jsonb;

COMMENT ON COLUMN panels.z_index IS 'Layer ordering for overlapping panels (higher = on top)';
COMMENT ON COLUMN panels.panel_type IS 'Panel type: standard, splash, inset, borderless';
COMMENT ON COLUMN panels.border_style IS 'Border style: solid, none, double';
COMMENT ON COLUMN panels.border_width IS 'Border width in pixels';
COMMENT ON COLUMN panels.panel_margins IS 'Panel margins in pixels: {top, right, bottom, left}';

-- Add constraints
ALTER TABLE panels
  ADD CONSTRAINT check_relative_x CHECK (relative_x IS NULL OR (relative_x >= 0 AND relative_x <= 1)),
  ADD CONSTRAINT check_relative_y CHECK (relative_y IS NULL OR (relative_y >= 0 AND relative_y <= 1)),
  ADD CONSTRAINT check_relative_width CHECK (relative_width IS NULL OR (relative_width > 0 AND relative_width <= 1)),
  ADD CONSTRAINT check_relative_height CHECK (relative_height IS NULL OR (relative_height > 0 AND relative_height <= 1)),
  ADD CONSTRAINT check_z_index CHECK (z_index > 0),
  ADD CONSTRAINT check_border_width CHECK (border_width >= 0);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Add index for layout template queries
CREATE INDEX IF NOT EXISTS idx_pages_layout_template 
  ON pages(layout_template_id);

-- Add index for panel ordering
CREATE INDEX IF NOT EXISTS idx_panels_z_index 
  ON panels(page_id, z_index);

-- ============================================================================
-- UPDATE EXISTING DATA
-- ============================================================================

-- Set default layout template for existing pages based on panel count
UPDATE pages p
SET layout_template_id = CASE 
  WHEN (SELECT COUNT(*) FROM panels WHERE page_id = p.id) = 1 THEN 'splash-single'
  WHEN (SELECT COUNT(*) FROM panels WHERE page_id = p.id) = 3 THEN 'establishing-3panel'
  WHEN (SELECT COUNT(*) FROM panels WHERE page_id = p.id) = 4 THEN 'dialogue-4panel'
  WHEN (SELECT COUNT(*) FROM panels WHERE page_id = p.id) = 5 THEN 'mixed-5panel'
  WHEN (SELECT COUNT(*) FROM panels WHERE page_id = p.id) = 6 THEN 'action-6panel'
  WHEN (SELECT COUNT(*) FROM panels WHERE page_id = p.id) >= 8 THEN 'grid-8panel'
  ELSE 'dialogue-4panel'
END
WHERE layout_template_id IS NULL;

-- Calculate relative positions from absolute positions for existing panels
-- This assumes standard page dimensions of 1200x1800 (can be adjusted)
UPDATE panels
SET 
  relative_x = CASE 
    WHEN x IS NOT NULL AND (SELECT width FROM pages WHERE id = panels.page_id) > 0 
    THEN x::decimal / (SELECT width FROM pages WHERE id = panels.page_id)
    ELSE 0
  END,
  relative_y = CASE 
    WHEN y IS NOT NULL AND (SELECT height FROM pages WHERE id = panels.page_id) > 0 
    THEN y::decimal / (SELECT height FROM pages WHERE id = panels.page_id)
    ELSE 0
  END,
  relative_width = CASE 
    WHEN width IS NOT NULL AND (SELECT width FROM pages WHERE id = panels.page_id) > 0 
    THEN width::decimal / (SELECT width FROM pages WHERE id = panels.page_id)
    ELSE 1
  END,
  relative_height = CASE 
    WHEN height IS NOT NULL AND (SELECT height FROM pages WHERE id = panels.page_id) > 0 
    THEN height::decimal / (SELECT height FROM pages WHERE id = panels.page_id)
    ELSE 1
  END
WHERE relative_x IS NULL;
