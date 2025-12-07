/**
 * Page Data Access Layer
 * 
 * Handles database operations for pages with layout template support.
 */

import { createClient } from '@/utils/supabase/client';
import type { PageModel, PageInsert, PageUpdate, PanelModel, PanelInsert } from '@/types/models';
import { getLayoutById, DEFAULT_PAGE_MARGINS } from '@/lib/layout-templates';
import { getPanelsForPage, createPanelsForPage } from './panels';

/**
 * Get a page by ID
 */
export async function getPage(pageId: string): Promise<PageModel | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching page:', error);
    throw new Error(`Failed to fetch page: ${error.message}`);
  }
  
  return data as PageModel;
}

/**
 * Get all pages for a project
 */
export async function getPagesForProject(
  projectId: string
): Promise<PageModel[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', projectId)
    .order('page_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching pages:', error);
    throw new Error(`Failed to fetch pages: ${error.message}`);
  }
  
  return data as PageModel[];
}

/**
 * Get page with its panels
 */
export async function getPageWithPanels(
  pageId: string
): Promise<{ page: PageModel; panels: PanelModel[] } | null> {
  const page = await getPage(pageId);
  
  if (!page) {
    return null;
  }
  
  const panels = await getPanelsForPage(pageId);
  
  return { page, panels };
}

/**
 * Save page with layout template
 */
export async function savePageWithLayout(
  page: Omit<PageInsert, 'id' | 'created_at' | 'updated_at'>,
  layoutTemplateId?: string
): Promise<PageModel> {
  const supabase = createClient();
  
  // Get layout template if provided
  let layout = null;
  if (layoutTemplateId) {
    layout = getLayoutById(layoutTemplateId);
    if (!layout) {
      throw new Error(`Layout template not found: ${layoutTemplateId}`);
    }
  }
  
  // Prepare page data
  const pageData: PageInsert = {
    ...page,
    layout_template_id: layoutTemplateId || null,
    margins: page.margins || DEFAULT_PAGE_MARGINS,
    width: page.width || 1200,
    height: page.height || 1800,
    // panel_count: layout?.panelCount || page.panel_count || 0,
  };
  
  const { data, error } = await supabase
    .from('pages')
    .insert(pageData)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving page:', error);
    throw new Error(`Failed to save page: ${error.message}`);
  }
  
  return data as PageModel;
}

/**
 * Update page layout template
 */
export async function updatePageLayout(
  pageId: string,
  layoutTemplateId: string
): Promise<PageModel> {
  const supabase = createClient();
  
  // Validate layout template exists
  const layout = getLayoutById(layoutTemplateId);
  if (!layout) {
    throw new Error(`Layout template not found: ${layoutTemplateId}`);
  }
  
  const { data, error } = await supabase
    .from('pages')
    .update({
      layout_template_id: layoutTemplateId,
      panel_count: layout.panelCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating page layout:', error);
    throw new Error(`Failed to update page layout: ${error.message}`);
  }
  
  return data as PageModel;
}

/**
 * Update page margins
 */
export async function updatePageMargins(
  pageId: string,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<PageModel> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('pages')
    .update({
      margins,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating page margins:', error);
    throw new Error(`Failed to update page margins: ${error.message}`);
  }
  
  return data as PageModel;
}

/**
 * Update page dimensions
 */
export async function updatePageDimensions(
  pageId: string,
  width: number,
  height: number
): Promise<PageModel> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('pages')
    .update({
      width,
      height,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating page dimensions:', error);
    throw new Error(`Failed to update page dimensions: ${error.message}`);
  }
  
  return data as PageModel;
}

/**
 * Delete a page and its panels
 */
export async function deletePage(pageId: string): Promise<void> {
  const supabase = createClient();
  
  // Panels will be deleted automatically via CASCADE
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId);
  
  if (error) {
    console.error('Error deleting page:', error);
    throw new Error(`Failed to delete page: ${error.message}`);
  }
}

/**
 * Create page with panels from layout template
 */
export async function createPageWithLayout(
  projectId: string,
  pageNumber: number,
  layoutTemplateId: string,
  options?: {
    width?: number;
    height?: number;
    margins?: { top: number; right: number; bottom: number; left: number };
    storyBeat?: string;
  }
): Promise<{ page: PageModel; panels: PanelModel[] }> {
  // Get layout template
  const layout = getLayoutById(layoutTemplateId);
  if (!layout) {
    throw new Error(`Layout template not found: ${layoutTemplateId}`);
  }
  
  // Create page
  const page = await savePageWithLayout({
    project_id: projectId,
    page_number: pageNumber,
    layout_template_id: layoutTemplateId,
    width: options?.width || 1200,
    height: options?.height || 1800,
    margins: options?.margins || DEFAULT_PAGE_MARGINS,
    // story_beat: options?.storyBeat || null,
    // panel_count: layout.panelCount,
    // layout_type: null,
    // thumbnail_url: '',
    layout_suggestion: null,
  });
  
  // Calculate safe area
  const margins = page.margins as any || DEFAULT_PAGE_MARGINS;
  const safeAreaWidth = page.width - margins.left - margins.right;
  const safeAreaHeight = page.height - margins.top - margins.bottom;
  
  // Create panels from layout template
  const panelsData: Array<Omit<PanelInsert, 'id' | 'page_id' | 'created_at' | 'updated_at'>> = layout.panels.map((panelTemplate, index) => ({
    panel_index: index,
    // Store relative positions from template
    relative_x: panelTemplate.x,
    relative_y: panelTemplate.y,
    relative_width: panelTemplate.width,
    relative_height: panelTemplate.height,
    // Calculate absolute positions
    x: Math.round(margins.left + panelTemplate.x * safeAreaWidth + panelTemplate.margins.left),
    y: Math.round(margins.top + panelTemplate.y * safeAreaHeight + panelTemplate.margins.top),
    width: Math.round(panelTemplate.width * safeAreaWidth - panelTemplate.margins.left - panelTemplate.margins.right),
    height: Math.round(panelTemplate.height * safeAreaHeight - panelTemplate.margins.top - panelTemplate.margins.bottom),
    // Visual properties
    z_index: panelTemplate.zIndex,
    panel_type: panelTemplate.panelType,
    border_style: 'solid',
    border_width: 2,
    panel_margins: panelTemplate.margins as any,
    // Content (empty initially)
    image_url: null,
    prompt: '',
    character_ids: [],
    character_handles: null,
    style_locks: null,
    bubbles: [],
    bubble_positions: null,
    sketch_url: null,
    controlnet_strength: null,
    generation_params: null,
    // is_manually_edited: false,
    // locked: false,
    thumbnail_url: null,
    character_positions: null,
  }));
  
  const panels = await createPanelsForPage(
    page.id,
    panelsData,
    page.width,
    page.height
  );
  
  return { page, panels };
}

/**
 * Duplicate a page
 */
export async function duplicatePage(
  pageId: string,
  newPageNumber?: number
): Promise<{ page: PageModel; panels: PanelModel[] }> {
  const original = await getPageWithPanels(pageId);
  
  if (!original) {
    throw new Error(`Page not found: ${pageId}`);
  }
  
  const { page: originalPage, panels: originalPanels } = original;
  
  // Create new page
  const newPage = await savePageWithLayout({
    project_id: originalPage.project_id,
    page_number: newPageNumber || originalPage.page_number + 1,
    layout_template_id: originalPage.layout_template_id,
    width: originalPage.width,
    height: originalPage.height,
    margins: originalPage.margins,
    // @ts-expect-error
    story_beat: originalPage.story_beat,
    // @ts-expect-error
    panel_count: originalPage.panel_count,
    layout_type: originalPage.layout_type,
    thumbnail_url: null,
    layout_suggestion: originalPage.layout_suggestion,
  });
  
  // Duplicate panels
  const newPanelsData = originalPanels.map(panel => ({
    panel_index: panel.panel_index,
    x: panel.x,
    y: panel.y,
    width: panel.width,
    height: panel.height,
    relative_x: panel.relative_x,
    relative_y: panel.relative_y,
    relative_width: panel.relative_width,
    relative_height: panel.relative_height,
    z_index: panel.z_index,
    panel_type: panel.panel_type,
    border_style: panel.border_style,
    border_width: panel.border_width,
    panel_margins: panel.panel_margins,
    image_url: panel.image_url,
    prompt: panel.prompt,
    character_ids: panel.character_ids,
    character_handles: panel.character_handles,
    style_locks: panel.style_locks,
    bubbles: panel.bubbles,
    bubble_positions: panel.bubble_positions,
    sketch_url: panel.sketch_url,
    controlnet_strength: panel.controlnet_strength,
    generation_params: panel.generation_params,
    is_manually_edited: false, // Reset manual edit flag
    locked: false, // Reset lock flag
    thumbnail_url: panel.thumbnail_url,
    character_positions: panel.character_positions,
  }));
  
  const newPanels = await createPanelsForPage(
    newPage.id,
    // @ts-expect-error
    newPanelsData,
    newPage.width,
    newPage.height
  );
  
  return { page: newPage, panels: newPanels };
}

/**
 * Get page count for a project
 */
export async function getPageCount(projectId: string): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
  
  if (error) {
    console.error('Error counting pages:', error);
    throw new Error(`Failed to count pages: ${error.message}`);
  }
  
  return count || 0;
}
