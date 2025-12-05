import { create } from "zustand";
import type { Project, Page, Panel, Character } from "@/types";
import type { LayoutTemplate } from "@/types/layouts";
import { createClient } from "@/utils/supabase/client";
import { generatePanelsFromTemplate } from "@/lib/utils/layout-converter";

interface EditorState {
  // Core data state
  project: Project | null;
  pages: Page[];
  panels: Panel[];
  characters: Character[];
  
  // Selection state
  selectedPanelIds: string[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions - Project loading
  loadProject: (projectId: string) => Promise<void>;
  setProject: (project: Project | null) => void;
  
  // Actions - Pages
  setPages: (pages: Page[]) => void;
  addPage: (page: Page) => void;
  removePage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => Promise<void>;
  
  // Actions - Panels
  setPanels: (panels: Panel[]) => void;
  addPanel: (panel: Panel) => void;
  removePanel: (panelId: string) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => Promise<void>;
  deletePanels: (panelIds: string[]) => Promise<void>;
  applyLayoutTemplate: (pageId: string, template: LayoutTemplate) => Promise<void>;
  
  // Actions - Characters
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  removeCharacter: (characterId: string) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => Promise<void>;
  
  // Actions - Selection
  selectPanel: (panelId: string | null) => void;
  selectPanels: (panelIds: string[]) => void;
  togglePanelSelection: (panelId: string) => void;
  clearSelection: () => void;
  
  // Actions - Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions - Loading state
  setLoading: (isLoading: boolean) => void;
  
  // Utility methods
  getSelectedPanels: () => Panel[];
  getPanelById: (panelId: string) => Panel | null;
  getCharacterByHandle: (handle: string) => Character | null;
  
  // Reset
  reset: () => void;
}

const initialState = {
  project: null,
  pages: [],
  panels: [],
  characters: [],
  selectedPanelIds: [],
  isLoading: false,
  error: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  // Project loading
  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const supabase = createClient();
      
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (projectError) throw projectError;
      
      if (!projectData) {
        throw new Error("Project not found");
      }
      
      const project: Project = {
        id: projectData.id,
        userId: projectData.user_id,
        title: projectData.title,
        genre: projectData.genre ?? "",
        synopsis: projectData.synopsis ?? "",
        style: projectData.style as any,
        createdAt: new Date(projectData.created_at!),
        updatedAt: new Date(projectData.updated_at!),
      };
      
      // Load pages
      const { data: pagesData, error: pagesError } = await supabase
        .from("pages")
        .select("*")
        .eq("project_id", projectId)
        .order("page_number", { ascending: true });
      
      if (pagesError) throw pagesError;
      
      const pages: Page[] = (pagesData || []).map((page) => ({
        id: page.id,
        projectId: page.project_id,
        pageNumber: page.page_number,
        width: page.width,
        height: page.height,
        layoutTemplateId: page.layout_template_id ?? undefined,
        createdAt: new Date(page.created_at!),
        updatedAt: new Date(page.updated_at!),
      }));
      
      // Load all panels for all pages
      const { data: panelsData, error: panelsError } = await supabase
        .from("panels")
        .select("*")
        .in("page_id", pages.map(p => p.id))
        .order("panel_index", { ascending: true });
      
      if (panelsError) throw panelsError;
      
      const panels: Panel[] = (panelsData || []).map((panel) => ({
        id: panel.id,
        pageId: panel.page_id,
        panelIndex: panel.panel_index,
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
        imageUrl: panel.image_url ?? "",
        prompt: panel.prompt ?? "",
        characterRefs: panel.character_refs || [],
        characterHandles: panel.character_handles || [],
        styleLocks: panel.style_locks || [],
        bubbles: (panel.bubbles as any) || [],
        sketchUrl: panel.sketch_url ?? undefined,
        controlNetStrength: panel.controlnet_strength ?? undefined,
        generationParams: (panel.generation_params as any) ?? undefined,
        createdAt: new Date(panel.created_at!),
        updatedAt: new Date(panel.updated_at!),
      }));
      
      // Load characters
      const { data: charactersData, error: charactersError } = await supabase
        .from("characters")
        .select("*")
        .eq("project_id", projectId);
      
      if (charactersError) throw charactersError;
      
      const characters: Character[] = (charactersData || []).map((char) => ({
        id: char.id,
        projectId: char.project_id,
        name: char.name,
        handle: char.handle || `@${char.name}`,
        description: char.description ?? "",
        referenceImages: (char.reference_images as any) || { front: "", side: "", expressions: [] },
        turnaround: (char.turnaround as any) || {},
        expressions: (char.expressions as any) || [],
        promptTriggers: (char.prompt_triggers as any) || [],
        createdAt: new Date(char.created_at!),
      }));
      
      set({
        project,
        pages,
        panels,
        characters,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load project";
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error("Error loading project:", error);
    }
  },

  setProject: (project) => {
    set({ project });
  },

  // Pages actions
  setPages: (pages) => {
    set({ pages });
  },

  addPage: (page) => {
    set({ pages: [...get().pages, page] });
  },

  removePage: (pageId) => {
    set({
      pages: get().pages.filter((p) => p.id !== pageId),
      panels: get().panels.filter((panel) => panel.pageId !== pageId),
    });
  },

  updatePage: async (pageId: string, updates: Partial<Page>) => {
    const page = get().pages.find((p) => p.id === pageId);
    if (!page) return;

    // Optimistically update local state
    const updatedPage = { ...page, ...updates };
    set({
      pages: get().pages.map((p) => (p.id === pageId ? updatedPage : p)),
    });

    // Persist to database
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("pages")
        .update({
          page_number: updates.pageNumber ?? page.pageNumber,
          width: updates.width ?? page.width,
          height: updates.height ?? page.height,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update page:", error);
      // Revert optimistic update on error
      set({
        pages: get().pages.map((p) => (p.id === pageId ? page : p)),
      });
      set({ error: error instanceof Error ? error.message : "Failed to update page" });
    }
  },

  // Panels actions
  setPanels: (panels) => {
    set({ panels });
  },

  addPanel: (panel) => {
    set({ panels: [...get().panels, panel] });
  },

  removePanel: (panelId) => {
    set({
      panels: get().panels.filter((p) => p.id !== panelId),
      selectedPanelIds: get().selectedPanelIds.filter((id) => id !== panelId),
    });
  },

  deletePanels: async (panelIds: string[]) => {
    if (panelIds.length === 0) return;

    // Optimistically remove panels from local state
    const originalPanels = get().panels;
    const originalSelectedIds = get().selectedPanelIds;
    
    set({
      panels: get().panels.filter((p) => !panelIds.includes(p.id)),
      selectedPanelIds: get().selectedPanelIds.filter((id) => !panelIds.includes(id)),
    });

    // Delete from database
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("panels")
        .delete()
        .in("id", panelIds);

      if (error) throw error;
      
      console.log(`Successfully deleted ${panelIds.length} panel(s)`);
    } catch (error) {
      console.error("Failed to delete panels:", error);
      // Revert optimistic update on error
      set({
        panels: originalPanels,
        selectedPanelIds: originalSelectedIds,
      });
      set({ error: error instanceof Error ? error.message : "Failed to delete panels" });
      throw error; // Re-throw so caller can handle
    }
  },

  updatePanel: async (panelId: string, updates: Partial<Panel>) => {
    const panel = get().panels.find((p) => p.id === panelId);
    if (!panel) return;

    // Optimistically update local state
    const updatedPanel = { ...panel, ...updates };
    set({
      panels: get().panels.map((p) => (p.id === panelId ? updatedPanel : p)),
    });

    // Persist to database
    try {
      const supabase = createClient();
      
      const dbUpdate: Record<string, any> = {
        panel_index: updates.panelIndex ?? panel.panelIndex,
        x: updates.x ?? panel.x,
        y: updates.y ?? panel.y,
        width: updates.width ?? panel.width,
        height: updates.height ?? panel.height,
        image_url: updates.imageUrl ?? panel.imageUrl,
        prompt: updates.prompt ?? panel.prompt,
        character_refs: updates.characterRefs ?? panel.characterRefs,
        character_handles: updates.characterHandles ?? panel.characterHandles ?? [],
        style_locks: updates.styleLocks ?? panel.styleLocks ?? [],
        bubbles: updates.bubbles ?? panel.bubbles,
        generation_params: updates.generationParams ?? panel.generationParams,
        updated_at: new Date().toISOString(),
      };

      // Add optional fields if they exist in updates
      if ("sketchUrl" in updates) {
        dbUpdate.sketch_url = updates.sketchUrl;
      }
      if ("controlNetStrength" in updates) {
        dbUpdate.controlnet_strength = updates.controlNetStrength;
      }

      const { error } = await supabase
        .from("panels")
        .update(dbUpdate)
        .eq("id", panelId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update panel:", error);
      // Revert optimistic update on error
      set({
        panels: get().panels.map((p) => (p.id === panelId ? panel : p)),
      });
      set({ error: error instanceof Error ? error.message : "Failed to update panel" });
    }
  },

  applyLayoutTemplate: async (pageId: string, template: LayoutTemplate) => {
    const page = get().pages.find((p) => p.id === pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    try {
      const supabase = createClient();

      // Update page with layout template ID
      const { error: pageError } = await supabase
        .from("pages")
        .update({
          layout_template_id: template.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId);

      if (pageError) throw pageError;

      // Update local page state
      set({
        pages: get().pages.map((p) =>
          p.id === pageId ? { ...p, layoutTemplateId: template.id } : p
        ),
      });

      // Generate panel data from template
      const panelData = generatePanelsFromTemplate(
        template,
        pageId,
        page.width || 1654,
        page.height || 2339
      );

      // Create panels in database
      const { data: createdPanels, error } = await supabase
        .from("panels")
        .insert(
          panelData.map((panel) => ({
            page_id: panel.pageId,
            panel_index: panel.panelIndex,
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
            image_url: panel.imageUrl || "",
            prompt: panel.prompt || "",
            character_refs: [],
            character_handles: panel.characterHandles || [],
            style_locks: panel.styleLocks || [],
            bubbles: panel.bubbles || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        )
        .select();

      if (error) throw error;

      // Convert database records to Panel objects
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
        createdAt: new Date(panel.created_at),
        updatedAt: new Date(panel.updated_at),
      }));

      // Update local state with new panels
      set({
        panels: [...get().panels, ...newPanels],
      });

      console.log(`Applied layout template with ${newPanels.length} panels`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to apply layout template";
      set({ error: errorMessage });
      console.error("Failed to apply layout template:", error);
      throw error;
    }
  },

  // Characters actions
  setCharacters: (characters) => {
    set({ characters });
  },

  addCharacter: (character) => {
    set({ characters: [...get().characters, character] });
  },

  removeCharacter: (characterId) => {
    set({
      characters: get().characters.filter((c) => c.id !== characterId),
    });
  },

  updateCharacter: async (characterId: string, updates: Partial<Character>) => {
    const character = get().characters.find((c) => c.id === characterId);
    if (!character) return;

    // Optimistically update local state
    const updatedCharacter = { ...character, ...updates };
    set({
      characters: get().characters.map((c) =>
        c.id === characterId ? updatedCharacter : c
      ),
    });

    // Persist to database
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("characters")
        .update({
          name: updates.name ?? character.name,
          handle: updates.handle ?? character.handle,
          description: updates.description ?? character.description,
          reference_images: updates.referenceImages ?? character.referenceImages,
          turnaround: updates.turnaround ?? character.turnaround,
          expressions: updates.expressions ?? character.expressions,
          prompt_triggers: updates.promptTriggers ?? character.promptTriggers,
        })
        .eq("id", characterId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update character:", error);
      // Revert optimistic update on error
      set({
        characters: get().characters.map((c) =>
          c.id === characterId ? character : c
        ),
      });
      set({ error: error instanceof Error ? error.message : "Failed to update character" });
    }
  },

  // Selection actions
  selectPanel: (panelId) => {
    set({
      selectedPanelIds: panelId ? [panelId] : [],
    });
  },

  selectPanels: (panelIds) => {
    set({ selectedPanelIds: panelIds });
  },

  togglePanelSelection: (panelId) => {
    const { selectedPanelIds } = get();
    const isSelected = selectedPanelIds.includes(panelId);

    if (isSelected) {
      set({
        selectedPanelIds: selectedPanelIds.filter((id) => id !== panelId),
      });
    } else {
      set({ selectedPanelIds: [...selectedPanelIds, panelId] });
    }
  },

  clearSelection: () => {
    set({ selectedPanelIds: [] });
  },

  // Error handling
  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Loading state
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Utility methods
  getSelectedPanels: () => {
    const { selectedPanelIds, panels } = get();
    return panels.filter((p) => selectedPanelIds.includes(p.id));
  },

  getPanelById: (panelId: string) => {
    return get().panels.find((p) => p.id === panelId) ?? null;
  },

  getCharacterByHandle: (handle: string) => {
    return get().characters.find((c) => c.handle === handle) ?? null;
  },

  // Reset
  reset: () => {
    set(initialState);
  },
}));
