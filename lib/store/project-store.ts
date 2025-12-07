import { create } from "zustand";
import type { ProjectModel as Project, Page, Character, StyleType, Panel, SpeechBubble } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface ProjectState {
  // State
  currentProject: Project | null;
  currentPage: Page | null;
  pages: Page[];
  characters: Character[];
  canvasMode: "paginated" | "webtoon-vertical";
  isLoading: boolean;
  error: string | null;

  // Grid settings
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // Auto-save settings
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  lastSaved: Date | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setCurrentPage: (page: Page | null) => void;
  setCanvasMode: (mode: "paginated" | "webtoon-vertical") => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  setLastSaved: (date: Date | null) => void;
  loadProject: (projectId: string) => Promise<void>;
  loadPages: (projectId: string) => Promise<void>;
  loadPanelsForPage: (pageId: string) => Promise<void>;
  loadCharacters: (projectId: string) => Promise<void>;
  saveProject: (project: Partial<Project>) => Promise<void>;
  savePage: (page: Partial<Page>) => Promise<void>;
  createPage: (projectId: string, pageNumber: number) => Promise<Page>;
  deletePage: (pageId: string) => Promise<void>;
  reorderPages: (pageIds: string[]) => Promise<void>;
  reset: () => void;
}

const initialState = {
  currentProject: null,
  currentPage: null,
  pages: [],
  characters: [],
  canvasMode: "paginated" as const,
  isLoading: false,
  error: null,
  showGrid: false,
  snapToGrid: true,
  gridSize: 50,
  autoSaveEnabled: true,
  autoSaveInterval: 10000, // 10 seconds
  lastSaved: null,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setCanvasMode: (mode) => {
    set({ canvasMode: mode });

    // Persist to project settings if project is loaded
    const { currentProject } = get();
    if (currentProject) {
      // TODO: Save to database
      console.log("Canvas mode changed to:", mode);
    }
  },

  setShowGrid: (show) => {
    set({ showGrid: show });
  },

  setSnapToGrid: (snap) => {
    set({ snapToGrid: snap });
  },

  setGridSize: (size) => {
    set({ gridSize: Math.max(10, Math.min(200, size)) }); // Clamp between 10 and 200
  },

  setAutoSaveEnabled: (enabled) => {
    set({ autoSaveEnabled: enabled });
  },

  setAutoSaveInterval: (interval) => {
    set({ autoSaveInterval: Math.max(5000, interval) }); // Minimum 5 seconds
  },

  setLastSaved: (date) => {
    set({ lastSaved: date });
  },

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      if (data) {
        const project: Project = {
          id: data.id,
          // @ts-expect-error
          userId: data.user_id,
          title: data.title,
          genre: data.genre ?? '',
          synopsis: data.synopsis ?? '',
          style: data.style as StyleType,
          createdAt: new Date(data.created_at!),
          updatedAt: new Date(data.updated_at!),
        };

        set({ currentProject: project, isLoading: false });

        // Load related data
        await Promise.all([
          get().loadPages(projectId),
          get().loadCharacters(projectId),
        ]);
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load project",
        isLoading: false,
      });
    }
  },

  loadPages: async (projectId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("project_id", projectId)
        .order("page_number", { ascending: true });

      if (error) throw error;

      if (data) {
        const pages: Page[] = data.map((page) => ({
          id: page.id,
          projectId: page.project_id,
          pageNumber: page.page_number,
          width: page.width,
          height: page.height,
          // layoutData: page.layout_data,
          // thumbnailUrl: page.thumbnail_url,
          createdAt: new Date(page.created_at!),
          updatedAt: new Date(page.updated_at!),
        }));

        set({ pages });

        // Set first page as current if none is selected
        if (pages.length > 0 && !get().currentPage) {
          set({ currentPage: pages[0] });
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load pages",
      });
    }
  },

  loadPanelsForPage: async (pageId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("panels")
        .select("*")
        .eq("page_id", pageId)
        .order("panel_index", { ascending: true });

      if (error) throw error;

      if (data) {
        const panels: Panel[] = data.map((panel) => ({
          id: panel.id,
          pageId: panel.page_id,
          panelIndex: panel.panel_index,
          x: panel.x,
          y: panel.y,
          width: panel.width,
          height: panel.height,
          imageUrl: panel.image_url ?? '',
          prompt: panel.prompt ?? '',
          characterRefs: panel.character_refs || [],
          characterHandles: panel.character_handles || [],
          styleLocks: panel.style_locks || [],
          bubbles: panel.bubbles as unknown as SpeechBubble[] || [],
          sketchUrl: panel.sketch_url ?? '',
          controlNetStrength: panel.controlnet_strength as number,
          generationParams: panel.generation_params as any,
          createdAt: new Date(panel.created_at!),
          updatedAt: new Date(panel.updated_at!),
        }));

        // Update canvas store with loaded panels
        // const { setPanels } = await import("@/lib/store/canvas-store");
        // const canvasStore = await import("@/lib/store/canvas-store");
        // canvasStore.useCanvasStore.getState().setPanels(panels);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load panels",
      });
    }
  },

  loadCharacters: async (projectId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      if (data) {
        const characters: Character[] = data.map((char) => ({
          id: char.id,
          projectId: char.project_id,
          name: char.name,
          handle: char.handle || `@${char.name}`,
          description: char.description ?? '',
          referenceImages: char.reference_images as any,
          turnaround: char.turnaround as any || {},
          expressions: char.expressions  as any || [],
          promptTriggers: char.prompt_triggers as any,
          createdAt: new Date(char.created_at!),
        }));

        set({ characters });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load characters",
      });
    }
  },

  saveProject: async (projectUpdates: Partial<Project>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .update({
          title: projectUpdates.title,
          genre: projectUpdates.genre,
          synopsis: projectUpdates.synopsis,
          style: projectUpdates.style,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProject.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedProject: Project = {
          id: data.id,
          // @ts-expect-error
          userId: data.user_id,
          title: data.title,
          genre: data.genre ?? '',
          synopsis: data.synopsis ?? '',
          style: data.style as any,
          createdAt: new Date(data.created_at!),
          updatedAt: new Date(data.updated_at!),
        };

        set({ currentProject: updatedProject, isLoading: false });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to save project",
        isLoading: false,
      });
    }
  },

  savePage: async (pageUpdates: Partial<Page>) => {
    const { currentPage } = get();
    if (!currentPage) return;

    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pages")
        .update({
          // layout_data: pageUpdates.layoutData,
          // thumbnail_url: pageUpdates.thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentPage.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedPage: Page = {
          id: data.id,
          projectId: data.project_id,
          pageNumber: data.page_number,
          width: 1200,
          height: 1800,
          // layoutData: data.layout_data,
          // thumbnailUrl: data.thumbnail_url,
          createdAt: new Date(data.created_at!),
          updatedAt: new Date(data.updated_at!),
        };

        set({ currentPage: updatedPage, isLoading: false });

        // Update in pages array
        const pages = get().pages.map((p) =>
          p.id === updatedPage.id ? updatedPage : p
        );
        set({ pages });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to save page",
        isLoading: false,
      });
    }
  },

  createPage: async (projectId: string, pageNumber: number) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pages")
        .insert({
          project_id: projectId,
          page_number: pageNumber,
          layout_data: {
            template: "standard-grid",
            panels: [],
          },
        })
        .select()
        .single();

      if (error) throw error;

      const newPage: Page = {
        id: data.id,
        projectId: data.project_id,
        pageNumber: data.page_number,
        width: 1200,
        height: 1800,
        // layoutData: data.layout_data,
        // thumbnailUrl: data.thumbnail_url,
        createdAt: new Date(data.created_at!),
        updatedAt: new Date(data.updated_at!),
      };

      set({
        pages: [...get().pages, newPage],
        isLoading: false,
      });

      return newPage;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create page",
        isLoading: false,
      });
      throw error;
    }
  },

  deletePage: async (pageId: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { error } = await supabase.from("pages").delete().eq("id", pageId);

      if (error) throw error;

      set({
        pages: get().pages.filter((p) => p.id !== pageId),
        currentPage:
          get().currentPage?.id === pageId ? null : get().currentPage,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete page",
        isLoading: false,
      });
    }
  },

  reorderPages: async (pageIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      // Update page numbers based on new order
      const updates = pageIds.map((pageId, index) => ({
        id: pageId,
        page_number: index + 1,
      }));

      // Batch update
      for (const update of updates) {
        const { error } = await supabase
          .from("pages")
          .update({ page_number: update.page_number })
          .eq("id", update.id);

        if (error) throw error;
      }

      // Reload pages to reflect new order
      const { currentProject } = get();
      if (currentProject) {
        await get().loadPages(currentProject.id);
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to reorder pages",
        isLoading: false,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
