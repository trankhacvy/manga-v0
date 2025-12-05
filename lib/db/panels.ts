/**
 * Panel Data Access Layer
 * 
 * Handles database operations for panels with support for
 * both relative and absolute positioning.
 */

import { createClient } from '@/utils/supabase/client';
import type { PanelModel, PanelInsert, PanelUpdate } from '@/types/models';
import type { RelativePosition } from '@/types/layouts';
import { absoluteToRelative } from '@/lib/rendering/page-renderer';

/**
 * Get all panels for a page
 */
export async function getPanelsForPage(pageId: string): Promise<PanelModel[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('panels')
    .select('*')
    .eq('page_id', pageId)
    .order('panel_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching panels:', error);
    throw new Error(`Failed to fetch panels: ${error.message}`);
  }
  
  return data as PanelModel[];
}

/**
 * Get a single panel by ID
 */
export async function getPanel(panelId: string): Promise<PanelModel | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('panels')
    .select('*')
    .eq('id', panelId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching panel:', error);
    throw new Error(`Failed to fetch panel: ${error.message}`);
  }
  
  return data as PanelModel;
}

/**
 * Save panel with both relative and absolute positions
 */
export async function savePanelWithLayout(
  panel: Omit<PanelInsert, 'id' | 'created_at' | 'updated_at'>,
  pageWidth: number,
  pageHeight: number,
  safeAreaOffset: { x: number; y: number } = { x: 0, y: 0 }
): Promise<PanelModel> {
  const supabase = createClient();
  
  // Calculate relative positions if not provided
  let relativePosition: RelativePosition;
  
  if (panel.relative_x !== null && panel.relative_x !== undefined) {
    // Use provided relative positions
    relativePosition = {
      x: panel.relative_x,
      y: panel.relative_y!,
      width: panel.relative_width!,
      height: panel.relative_height!,
    };
  } else if (panel.x !== null && panel.x !== undefined) {
    // Calculate from absolute positions
    relativePosition = absoluteToRelative(
      {
        x: panel.x,
        y: panel.y!,
        width: panel.width!,
        height: panel.height!,
      },
      pageWidth,
      pageHeight,
      safeAreaOffset.x,
      safeAreaOffset.y
    );
  } else {
    throw new Error('Panel must have either relative or absolute positions');
  }
  
  // Prepare panel data with both coordinate systems
  const panelData: PanelInsert = {
    ...panel,
    // Relative positions (0-1 scale)
    relative_x: relativePosition.x,
    relative_y: relativePosition.y,
    relative_width: relativePosition.width,
    relative_height: relativePosition.height,
    // Absolute positions (pixels) - keep if provided
    x: panel.x ?? null,
    y: panel.y ?? null,
    width: panel.width ?? null,
    height: panel.height ?? null,
  };
  
  const { data, error } = await supabase
    .from('panels')
    .insert(panelData)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving panel:', error);
    throw new Error(`Failed to save panel: ${error.message}`);
  }
  
  return data as PanelModel;
}

/**
 * Update panel positions (for manual editing)
 */
export async function updatePanelPosition(
  panelId: string,
  position: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    relative_x?: number;
    relative_y?: number;
    relative_width?: number;
    relative_height?: number;
  },
  pageWidth?: number,
  pageHeight?: number
): Promise<PanelModel> {
  const supabase = createClient();
  
  // If absolute positions provided and page dimensions available, calculate relative
  if (position.x !== undefined && pageWidth && pageHeight) {
    const relative = absoluteToRelative(
      {
        x: position.x,
        y: position.y!,
        width: position.width!,
        height: position.height!,
      },
      pageWidth,
      pageHeight
    );
    
    position.relative_x = relative.x;
    position.relative_y = relative.y;
    position.relative_width = relative.width;
    position.relative_height = relative.height;
  }
  
  const updateData: PanelUpdate = {
    ...position,
    is_manually_edited: true,
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('panels')
    .update(updateData)
    .eq('id', panelId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating panel position:', error);
    throw new Error(`Failed to update panel position: ${error.message}`);
  }
  
  return data as PanelModel;
}

/**
 * Update panel content (image, prompt, etc.)
 */
export async function updatePanelContent(
  panelId: string,
  content: {
    image_url?: string;
    prompt?: string;
    character_handles?: string[];
    style_locks?: string[];
    bubbles?: any;
    generation_params?: Record<string, any>;
  }
): Promise<PanelModel> {
  const supabase = createClient();
  
  const updateData: PanelUpdate = {
    ...content,
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('panels')
    .update(updateData)
    .eq('id', panelId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating panel content:', error);
    throw new Error(`Failed to update panel content: ${error.message}`);
  }
  
  return data as PanelModel;
}

/**
 * Update panel bubbles
 */
export async function updatePanelBubbles(
  panelId: string,
  bubbles: any[]
): Promise<PanelModel> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('panels')
    .update({
      bubbles,
      updated_at: new Date().toISOString(),
    })
    .eq('id', panelId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating panel bubbles:', error);
    throw new Error(`Failed to update panel bubbles: ${error.message}`);
  }
  
  return data as PanelModel;
}

/**
 * Delete a panel
 */
export async function deletePanel(panelId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('panels')
    .delete()
    .eq('id', panelId);
  
  if (error) {
    console.error('Error deleting panel:', error);
    throw new Error(`Failed to delete panel: ${error.message}`);
  }
}

/**
 * Bulk create panels for a page
 */
export async function createPanelsForPage(
  pageId: string,
  panels: Array<Omit<PanelInsert, 'id' | 'page_id' | 'created_at' | 'updated_at'>>,
  pageWidth: number,
  pageHeight: number
): Promise<PanelModel[]> {
  const supabase = createClient();
  
  // Prepare panels with both coordinate systems
  const panelsData: PanelInsert[] = panels.map((panel, index) => {
    let relativePosition: RelativePosition;
    
    if (panel.relative_x !== null && panel.relative_x !== undefined) {
      relativePosition = {
        x: panel.relative_x,
        y: panel.relative_y!,
        width: panel.relative_width!,
        height: panel.relative_height!,
      };
    } else if (panel.x !== null && panel.x !== undefined) {
      relativePosition = absoluteToRelative(
        {
          x: panel.x,
          y: panel.y!,
          width: panel.width!,
          height: panel.height!,
        },
        pageWidth,
        pageHeight
      );
    } else {
      throw new Error(`Panel ${index} must have either relative or absolute positions`);
    }
    
    return {
      ...panel,
      page_id: pageId,
      panel_index: panel.panel_index ?? index,
      relative_x: relativePosition.x,
      relative_y: relativePosition.y,
      relative_width: relativePosition.width,
      relative_height: relativePosition.height,
    };
  });
  
  const { data, error } = await supabase
    .from('panels')
    .insert(panelsData)
    .select();
  
  if (error) {
    console.error('Error creating panels:', error);
    throw new Error(`Failed to create panels: ${error.message}`);
  }
  
  return data as PanelModel[];
}

/**
 * Lock/unlock a panel (prevent AI modifications)
 */
export async function togglePanelLock(
  panelId: string,
  locked: boolean
): Promise<PanelModel> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('panels')
    .update({
      locked,
      updated_at: new Date().toISOString(),
    })
    .eq('id', panelId)
    .select()
    .single();
  
  if (error) {
    console.error('Error toggling panel lock:', error);
    throw new Error(`Failed to toggle panel lock: ${error.message}`);
  }
  
  return data as PanelModel;
}

/**
 * Get panels that need regeneration (not locked, not manually edited)
 */
export async function getPanelsForRegeneration(
  pageId: string
): Promise<PanelModel[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('panels')
    .select('*')
    .eq('page_id', pageId)
    .eq('locked', false)
    .eq('is_manually_edited', false)
    .order('panel_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching panels for regeneration:', error);
    throw new Error(`Failed to fetch panels for regeneration: ${error.message}`);
  }
  
  return data as PanelModel[];
}
