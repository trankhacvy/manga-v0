-- Migration: Enhance Manga Generation Flow
-- This migration adds fields needed for the enhanced manga generation pipeline:
-- 1. Style anchor system for visual consistency
-- 2. Character consistency strings for efficient prompts
-- 3. Panel quality scoring for auto-regeneration

-- ============================================
-- PROJECTS TABLE: Style Anchor System
-- ============================================

-- Add style anchor URL (the hero image that establishes visual style)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS style_anchor_url TEXT;

-- Add style anchor data (style description, prompt suffix, etc.)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS style_anchor_data JSONB;

-- Add dramatic core data (separate from story_analysis for clarity)
-- This stores: centralConflict, stakes, emotionalArc, theTurn, splashMoments, visualMotif
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS dramatic_core JSONB;

-- ============================================
-- CHARACTERS TABLE: Consistency System
-- ============================================

-- Add consistency string (max 100 chars, used in every panel prompt)
-- Example: "tall spiky-haired teen, scar over left eye, red scarf, confident stance"
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS consistency_string TEXT;

-- Add visual anchors (structured consistency data)
-- Stores: silhouette, faceAnchor, clothingAnchor, primaryTone
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS visual_anchors JSONB;

-- ============================================
-- PANELS TABLE: Quality Control System
-- ============================================

-- Add quality score (1-10 overall score from vision model)
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS quality_score NUMERIC(3,1);

-- Add generation attempts count (for tracking regeneration loops)
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 1;

-- Add quality details (breakdown of scores and issues)
-- Stores: characterAccuracy, compositionQuality, styleConsistency, contentMatch, issues[]
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS quality_details JSONB;

-- ============================================
-- INDEXES for performance
-- ============================================

-- Index for finding panels that need regeneration (low quality score)
CREATE INDEX IF NOT EXISTS idx_panels_quality_score 
ON panels(quality_score) 
WHERE quality_score IS NOT NULL;

-- Index for finding characters by project with consistency string
CREATE INDEX IF NOT EXISTS idx_characters_project_consistency 
ON characters(project_id) 
WHERE consistency_string IS NOT NULL;

-- ============================================
-- COMMENTS for documentation
-- ============================================

COMMENT ON COLUMN projects.style_anchor_url IS 'URL of the style anchor image that establishes visual consistency';
COMMENT ON COLUMN projects.style_anchor_data IS 'Style anchor metadata: styleDescription, stylePromptSuffix, generatedAt';
COMMENT ON COLUMN projects.dramatic_core IS 'Dramatic story elements: centralConflict, stakes, emotionalArc, theTurn, splashMoments';

COMMENT ON COLUMN characters.consistency_string IS 'Condensed visual description (max 100 chars) for panel prompts';
COMMENT ON COLUMN characters.visual_anchors IS 'Structured visual anchors: silhouette, faceAnchor, clothingAnchor, primaryTone';

COMMENT ON COLUMN panels.quality_score IS 'AI-assessed quality score (1-10) for auto-regeneration decisions';
COMMENT ON COLUMN panels.generation_attempts IS 'Number of generation attempts for this panel';
COMMENT ON COLUMN panels.quality_details IS 'Detailed quality breakdown: characterAccuracy, compositionQuality, styleConsistency, contentMatch, issues';
