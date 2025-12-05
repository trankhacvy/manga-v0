/**
 * Clipboard store for copy/paste/duplicate operations
 * Stores panel data in memory for clipboard operations
 */

import { create } from "zustand";
import type { Panel } from "@/types";
import { useEditorStore } from "./editor-store";
import { createClient } from "@/utils/supabase/client";

interface ClipboardState {
  // Clipboard data
  copiedPanels: Panel[];

  // Actions
  copyPanels: (panels: Panel[]) => void;
  pastePanels: () => Promise<void>;
  duplicatePanels: (panels: Panel[]) => Promise<void>;
  clearClipboard: () => void;

  // Utility
  hasCopiedPanels: () => boolean;
}

/**
 * Generate a new unique ID for a panel
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Calculate offset position for pasted/duplicated panels
 */
function calculateOffset(panels: Panel[]): { x: number; y: number } {
  // Offset by 20px to make it clear it's a new panel
  return { x: 20, y: 20 };
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  copiedPanels: [],

  /**
   * Copy panels to clipboard
   */
  copyPanels: (panels: Panel[]) => {
    if (panels.length === 0) return;

    // Deep clone panels to avoid reference issues
    const clonedPanels = panels.map((panel) => ({
      ...panel,
      bubbles: panel.bubbles ? [...panel.bubbles] : [],
      characterRefs: panel.characterRefs ? [...panel.characterRefs] : [],
      characterHandles: panel.characterHandles ? [...panel.characterHandles] : [],
      styleLocks: panel.styleLocks ? [...panel.styleLocks] : [],
    }));

    set({ copiedPanels: clonedPanels });
    console.log(`Copied ${panels.length} panel(s) to clipboard`);
  },

  /**
   * Paste panels from clipboard
   * Creates new panels with new IDs at offset positions
   */
  pastePanels: async () => {
    const { copiedPanels } = get();
    if (copiedPanels.length === 0) {
      console.warn("No panels in clipboard to paste");
      return;
    }

    const offset = calculateOffset(copiedPanels);
    const supabase = createClient();
    const editorStore = useEditorStore.getState();

    try {
      // Create new panels with offset positions
      const newPanelsData = copiedPanels.map((panel) => ({
        page_id: panel.pageId,
        panel_index: panel.panelIndex,
        x: panel.x + offset.x,
        y: panel.y + offset.y,
        width: panel.width,
        height: panel.height,
        image_url: panel.imageUrl || "",
        prompt: panel.prompt || "",
        character_refs: panel.characterRefs || [],
        character_handles: panel.characterHandles || [],
        style_locks: panel.styleLocks || [],
        bubbles: panel.bubbles || [],
        sketch_url: panel.sketchUrl,
        controlnet_strength: panel.controlNetStrength,
        generation_params: panel.generationParams,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert into database
      const { data: createdPanels, error } = await supabase
        .from("panels")
        .insert(newPanelsData)
        .select();

      if (error) throw error;

      // Convert to Panel objects
      const newPanels: Panel[] = (createdPanels || []).map((panel) => ({
        id: panel.id,
        pageId: panel.page_id,
        panelIndex: panel.panel_index,
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
        imageUrl: panel.image_url || "",
        prompt: panel.prompt || "",
        characterRefs: panel.character_refs || [],
        characterHandles: panel.character_handles || [],
        styleLocks: panel.style_locks || [],
        bubbles: panel.bubbles || [],
        sketchUrl: panel.sketch_url,
        controlNetStrength: panel.controlnet_strength,
        generationParams: panel.generation_params,
        createdAt: new Date(panel.created_at),
        updatedAt: new Date(panel.updated_at),
      }));

      // Add to editor store
      newPanels.forEach((panel) => {
        editorStore.addPanel(panel);
      });

      // Select the newly pasted panels
      editorStore.selectPanels(newPanels.map((p) => p.id));

      console.log(`Pasted ${newPanels.length} panel(s)`);
    } catch (error) {
      console.error("Failed to paste panels:", error);
      throw error;
    }
  },

  /**
   * Duplicate panels (copy + paste in one action)
   * Creates new panels with offset positions
   */
  duplicatePanels: async (panels: Panel[]) => {
    if (panels.length === 0) return;

    const offset = calculateOffset(panels);
    const supabase = createClient();
    const editorStore = useEditorStore.getState();

    try {
      // Create new panels with offset positions
      const newPanelsData = panels.map((panel) => ({
        page_id: panel.pageId,
        panel_index: panel.panelIndex,
        x: panel.x + offset.x,
        y: panel.y + offset.y,
        width: panel.width,
        height: panel.height,
        image_url: panel.imageUrl || "",
        prompt: panel.prompt || "",
        character_refs: panel.characterRefs || [],
        character_handles: panel.characterHandles || [],
        style_locks: panel.styleLocks || [],
        bubbles: panel.bubbles || [],
        sketch_url: panel.sketchUrl,
        controlnet_strength: panel.controlNetStrength,
        generation_params: panel.generationParams,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert into database
      const { data: createdPanels, error } = await supabase
        .from("panels")
        .insert(newPanelsData)
        .select();

      if (error) throw error;

      // Convert to Panel objects
      const newPanels: Panel[] = (createdPanels || []).map((panel) => ({
        id: panel.id,
        pageId: panel.page_id,
        panelIndex: panel.panel_index,
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
        imageUrl: panel.image_url || "",
        prompt: panel.prompt || "",
        characterRefs: panel.character_refs || [],
        characterHandles: panel.character_handles || [],
        styleLocks: panel.style_locks || [],
        bubbles: panel.bubbles || [],
        sketchUrl: panel.sketch_url,
        controlNetStrength: panel.controlnet_strength,
        generationParams: panel.generation_params,
        createdAt: new Date(panel.created_at),
        updatedAt: new Date(panel.updated_at),
      }));

      // Add to editor store
      newPanels.forEach((panel) => {
        editorStore.addPanel(panel);
      });

      // Select the newly duplicated panels
      editorStore.selectPanels(newPanels.map((p) => p.id));

      console.log(`Duplicated ${newPanels.length} panel(s)`);
    } catch (error) {
      console.error("Failed to duplicate panels:", error);
      throw error;
    }
  },

  /**
   * Clear clipboard
   */
  clearClipboard: () => {
    set({ copiedPanels: [] });
  },

  /**
   * Check if clipboard has panels
   */
  hasCopiedPanels: () => {
    return get().copiedPanels.length > 0;
  },
}));
