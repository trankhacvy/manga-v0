-- Migration: Update schema for new detailed generation flow
-- This migration adds support for story analysis, character embeddings, layout planning, and bubble positioning

-- ============================================================================
-- PROJECTS TABLE UPDATES
-- ============================================================================

-- Add story analysis storage
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS story_analysis JSONB;

COMMENT ON COLUMN projects.story_analysis IS 'Detailed story analysis including themes, settings, tonal shifts, key scenes, and pacing';

-- ============================================================================
-- CHARACTERS TABLE UPDATES
-- ============================================================================

-- Add character embedding data for IP-Adapter consistency
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS embedding_data JSONB;

COMMENT ON COLUMN characters.embedding_data IS 'IP-Adapter embedding data for character consistency across panels';

-- ============================================================================
-- PAGES TABLE UPDATES
-- ============================================================================

-- Add layout suggestion field
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS layout_suggestion TEXT;

COMMENT ON COLUMN pages.layout_suggestion IS 'Suggested layout type: focus-panel, action-spread, grid-4, grid-6, custom';

-- ============================================================================
-- PANELS TABLE UPDATES
-- ============================================================================

-- Add bubble positioning data
ALTER TABLE panels
  ADD COLUMN IF NOT EXISTS bubble_positions JSONB;

COMMENT ON COLUMN panels.bubble_positions IS 'Calculated optimal positions for speech bubbles with tail directions';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Add index for story analysis queries (if needed for analytics)
CREATE INDEX IF NOT EXISTS idx_projects_story_analysis 
  ON projects USING GIN(story_analysis);

-- Add index for character embeddings (for similarity searches if needed)
CREATE INDEX IF NOT EXISTS idx_characters_embedding 
  ON characters USING GIN(embedding_data);
