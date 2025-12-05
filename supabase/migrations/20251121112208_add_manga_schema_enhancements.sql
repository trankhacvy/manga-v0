-- Migration: Add manga schema enhancements
-- This migration updates the existing schema to match the enhanced requirements

-- ============================================================================
-- PROJECTS TABLE UPDATES
-- ============================================================================

-- Add new columns to projects table
ALTER TABLE projects 
--   ADD COLUMN IF NOT EXISTS story_input TEXT,
--   ADD COLUMN IF NOT EXISTS art_style TEXT,
--   ADD COLUMN IF NOT EXISTS target_page_count INTEGER DEFAULT 8,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Rename 'style' to match new schema (if you want to keep existing data)
-- If you prefer to keep both, comment this out
-- DO $$ 
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_name = 'projects' AND column_name = 'style'
--   ) THEN
--     -- Copy data from 'style' to 'art_style' if art_style is empty
--     UPDATE projects SET art_style = style WHERE art_style IS NULL;
--   END IF;
-- END $$;

-- Rename 'synopsis' to 'story_input' (optional - keeps existing data)
-- DO $$ 
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_name = 'projects' AND column_name = 'synopsis'
--   ) THEN
--     UPDATE projects SET story_input = synopsis WHERE story_input IS NULL;
--   END IF;
-- END $$;

-- Update status column to use 'draft' as default
ALTER TABLE projects 
  ALTER COLUMN generation_stage SET DEFAULT 'draft';

-- Rename generation_stage to status (if you want to consolidate)
-- Uncomment if you want to replace generation_stage with status
-- ALTER TABLE projects RENAME COLUMN generation_stage TO status;

-- ============================================================================
-- CHARACTERS TABLE UPDATES
-- ============================================================================

-- Add new columns to characters table
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS aliases TEXT[],
  ADD COLUMN IF NOT EXISTS reference_image TEXT,
  ADD COLUMN IF NOT EXISTS ip_adapter_embedding JSONB,
  ADD COLUMN IF NOT EXISTS outfits JSONB;

-- Re-add unique constraint on (project_id, handle) since it was removed
-- Only add if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'characters_project_id_handle_key'
  ) THEN
    ALTER TABLE characters 
      ADD CONSTRAINT characters_project_id_handle_key 
      UNIQUE(project_id, handle);
  END IF;
END $$;

-- ============================================================================
-- PAGES TABLE UPDATES
-- ============================================================================

-- Add layout_type column to pages
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS layout_type TEXT NOT NULL DEFAULT 'grid-4';

-- Update width and height to INTEGER (from FLOAT)
ALTER TABLE pages
  ALTER COLUMN width TYPE INTEGER USING width::INTEGER,
  ALTER COLUMN height TYPE INTEGER USING height::INTEGER,
  ALTER COLUMN width SET DEFAULT 800,
  ALTER COLUMN height SET DEFAULT 1200;

-- ============================================================================
-- PANELS TABLE UPDATES
-- ============================================================================

-- Add new columns to panels table
ALTER TABLE panels
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS character_ids UUID[],
  ADD COLUMN IF NOT EXISTS character_positions JSONB;

-- Ensure character_handles exists (it should from init)
-- This is just a safety check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'panels' AND column_name = 'character_handles'
  ) THEN
    ALTER TABLE panels ADD COLUMN character_handles TEXT[];
  END IF;
END $$;

-- Migrate character_refs to character_handles if needed
UPDATE panels 
SET character_handles = character_refs 
WHERE character_handles IS NULL AND character_refs IS NOT NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Add GIN index for character_ids array (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_panels_character_ids 
  ON panels USING GIN(character_ids);

-- Update existing indexes to match new naming convention
-- These should already exist from init migration, but we ensure they're there
CREATE INDEX IF NOT EXISTS idx_projects_user 
  ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_characters_project 
  ON characters(project_id);

CREATE INDEX IF NOT EXISTS idx_pages_project 
  ON pages(project_id);

CREATE INDEX IF NOT EXISTS idx_panels_page 
  ON panels(page_id);

-- ============================================================================
-- COMMENTS (Optional - for documentation)
-- ============================================================================

-- COMMENT ON COLUMN projects.story_input IS 'User input for story generation';
-- COMMENT ON COLUMN projects.art_style IS 'Art style: manga-classic, manhwa, etc.';
-- COMMENT ON COLUMN projects.target_page_count IS 'Target number of pages for the project';
COMMENT ON COLUMN projects.metadata IS 'Additional project metadata';

COMMENT ON COLUMN characters.aliases IS 'Alternative names/references for the character';
COMMENT ON COLUMN characters.reference_image IS 'Primary reference image URL';
COMMENT ON COLUMN characters.ip_adapter_embedding IS 'IP adapter embedding for consistency';
COMMENT ON COLUMN characters.outfits IS 'Available outfits for the character';

COMMENT ON COLUMN pages.layout_type IS 'Layout type: grid-4, grid-6, etc.';

COMMENT ON COLUMN panels.thumbnail_url IS 'Thumbnail version of the panel image';
COMMENT ON COLUMN panels.character_ids IS 'Array of character UUIDs in this panel';
COMMENT ON COLUMN panels.character_positions IS 'Bounding boxes for character positions';
