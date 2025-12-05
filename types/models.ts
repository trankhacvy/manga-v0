/**
 * Database Model Types
 * 
 * This file provides type-safe models that map directly from Supabase generated types.
 * 
 * Approach:
 * 1. Direct type exports (ProjectRow, CharacterRow, etc.) map 1:1 with database tables
 * 2. Enhanced models (ProjectModel, CharacterModel, etc.) extend database types with:
 *    - Typed JSONB fields for better IDE support
 *    - Additional UI-specific fields not stored in database
 * 3. Helper functions convert database rows to typed models
 * 4. Create/Update types provide type safety for insert/update operations
 * 
 * Usage:
 * - Use *Row types when working directly with Supabase queries
 * - Use *Model types in your application logic
 * - Use Create* types when inserting new records
 * - Use Update* types when updating existing records
 */

import type { Tables, TablesInsert, TablesUpdate } from "./database.types";
import type { StyleType, LayoutTemplate, BubbleType } from "./index";

// ============================================================================
// Direct mappings from Supabase types
// ============================================================================

export type ProjectRow = Tables<"projects">;
export type ProjectInsert = TablesInsert<"projects">;
export type ProjectUpdate = TablesUpdate<"projects">;

export type CharacterRow = Tables<"characters">;
export type CharacterInsert = TablesInsert<"characters">;
export type CharacterUpdate = TablesUpdate<"characters">;

export type PageRow = Tables<"pages">;
export type PageInsert = TablesInsert<"pages">;
export type PageUpdate = TablesUpdate<"pages">;

export type PanelRow = Tables<"panels">;
export type PanelInsert = TablesInsert<"panels">;
export type PanelUpdate = TablesUpdate<"panels">;

export type PanelVersionRow = Tables<"panel_versions">;
export type PanelVersionInsert = TablesInsert<"panel_versions">;
export type PanelVersionUpdate = TablesUpdate<"panel_versions">;

export type ProjectScriptRow = Tables<"project_scripts">;
export type ProjectScriptInsert = TablesInsert<"project_scripts">;
export type ProjectScriptUpdate = TablesUpdate<"project_scripts">;

// ============================================================================
// Enhanced models with typed JSONB fields
// ============================================================================

export interface ProjectModel extends Omit<ProjectRow, 'generation_progress' | 'metadata'> {
  generation_progress?: {
    script: number;
    characters: number;
    storyboard: number;
    preview: number;
  };
  metadata?: Record<string, any>;
  // Convenience accessors for new schema
  // story_input?: string;
  // art_style?: string;
  // target_page_count?: number;
  // status?: string; // Maps to generation_stage
}

export interface CharacterModel extends Omit<CharacterRow, 'reference_images' | 'turnaround' | 'expressions' | 'outfits' | 'ip_adapter_embedding' | 'aliases' | 'reference_image'> {
  reference_images?: {
    front?: string;
    side?: string;
    expressions?: string[];
  } | null;
  turnaround: {
    front?: string;
    side?: string;
    back?: string;
    threequarter?: string;
  };
  expressions?: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }> | null;
  outfits?: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }> | null;
  ip_adapter_embedding?: Record<string, any> | null;
  // New fields from enhanced schema
  aliases?: string[] | null;
  reference_image?: string | null;
}

export interface PageModel extends PageRow {
  layout_data?: {
    template: LayoutTemplate;
    panels: PanelModel[];
  };
  thumbnail_url?: string;
  // layout_type is now part of PageRow from database
}

export interface PanelModel extends Omit<PanelRow, 'bubbles' | 'generation_params' | 'character_positions'> {
  bubbles?: SpeechBubbleModel[];
  generation_params?: Record<string, any>;
  character_positions?: {
    [characterId: string]: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  // Additional UI-specific fields
  mask_region?: {
    x: number;
    y: number;
    width: number;
    height: number;
    maskDataUrl?: string;
  };
  version_history?: PanelVersionModel[];
  // character_ids, character_handles, thumbnail_url now part of PanelRow
}

export interface SpeechBubbleModel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: BubbleType;
}

export interface PanelVersionModel extends PanelVersionRow {
  // Additional metadata not in database
  prompt?: string;
  character_handles?: string[];
  style_locks?: string[];
  parameters?: Record<string, any>;
}

export interface GenerationJobModel {
  id: string;
  project_id: string;
  panel_id?: string;
  job_type: string; // 'script' | 'character' | 'panel' | 'export'
  status: string; // 'queued' | 'processing' | 'complete' | 'failed'
  progress: number;
  error_message?: string;
  result?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserCreditsModel {
  id: string;
  user_id: string;
  tier: string; // 'free' | 'pro' | 'superpro'
  credits_remaining: number;
  daily_limit: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreditTransactionModel {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string; // 'generation' | 'purchase' | 'refund' | 'daily_reset'
  reference_id?: string;
  created_at: string;
}

export interface ProjectExportModel {
  id: string;
  project_id: string;
  format: string; // 'pdf' | 'webtoon-png' | 'tapas' | 'kindle' | 'epub' | 'webp'
  status: string; // 'processing' | 'complete' | 'failed'
  file_url?: string;
  file_size?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Helper types for working with models
// ============================================================================

// Type-safe helpers for creating new records
export type CreateProject = Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>;
export type CreateCharacter = Omit<CharacterInsert, 'id' | 'created_at' | 'updated_at'>;
export type CreatePage = Omit<PageInsert, 'id' | 'created_at' | 'updated_at'>;
export type CreatePanel = Omit<PanelInsert, 'id' | 'created_at' | 'updated_at'>;

// Type-safe helpers for updating records
export type UpdateProject = ProjectUpdate;
export type UpdateCharacter = CharacterUpdate;
export type UpdatePage = PageUpdate;
export type UpdatePanel = PanelUpdate;

// Helper to convert database row to model with typed JSONB
export function toProjectModel(row: ProjectRow): ProjectModel {
  return {
    ...row,
    generation_progress: row.generation_progress as ProjectModel['generation_progress'],
    metadata: row.metadata as ProjectModel['metadata'],
  };
}

export function toCharacterModel(row: CharacterRow): CharacterModel {
  return {
    ...row,
    reference_images: row.reference_images as CharacterModel['reference_images'],
    turnaround: row.turnaround as CharacterModel['turnaround'],
    expressions: row.expressions as CharacterModel['expressions'],
    outfits: row.outfits as CharacterModel['outfits'],
    ip_adapter_embedding: row.ip_adapter_embedding as CharacterModel['ip_adapter_embedding'],
  };
}

export function toPanelModel(row: PanelRow): PanelModel {
  return {
    ...row,
    bubbles: (row.bubbles as unknown) as PanelModel['bubbles'],
    generation_params: (row.generation_params as unknown) as PanelModel['generation_params'],
    character_positions: (row.character_positions as unknown) as PanelModel['character_positions'],
  };
}

// Type guards
export function isProjectModel(obj: any): obj is ProjectModel {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
}

export function isCharacterModel(obj: any): obj is CharacterModel {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.handle === 'string';
}

export function isPanelModel(obj: any): obj is PanelModel {
  return obj && typeof obj.id === 'string' && typeof obj.page_id === 'string';
}
