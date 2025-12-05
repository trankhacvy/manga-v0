import { useEffect, useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { useCanvasStore } from "@/lib/store/canvas-store";

interface ProjectRestorationState {
  isRestoring: boolean;
  error: string | null;
  isComplete: boolean;
}

/**
 * Hook to restore project state when opening a project
 * Loads all pages, panels, characters, and restores canvas state
 * 
 * Task 11.1: Debug panel data loading
 */
export function useProjectRestoration(projectId: string) {
  const [state, setState] = useState<ProjectRestorationState>({
    isRestoring: true,
    error: null,
    isComplete: false,
  });

  const loadProject = useProjectStore((state) => state.loadProject);
  const loadPanelsForPage = useProjectStore((state) => state.loadPanelsForPage);
  const currentPage = useProjectStore((state) => state.currentPage);
  const restoreCanvasState = useCanvasStore(
    (state) => state.restoreCanvasState
  );
  const panels = useCanvasStore((state) => state.panels);

  useEffect(() => {
    let isMounted = true;

    const restoreProject = async () => {
      try {
        console.log("[Project Restoration] Starting restoration for project:", projectId);
        setState({ isRestoring: true, error: null, isComplete: false });

        // Load project data (includes pages and characters)
        console.log("[Project Restoration] Loading project data...");
        await loadProject(projectId);

        if (!isMounted) return;

        // Wait a bit for currentPage to be set
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Load panels for the current page
        const page = useProjectStore.getState().currentPage;
        console.log("[Project Restoration] Current page:", page);
        
        if (page) {
          console.log("[Project Restoration] Loading panels for page:", page.id);
          await loadPanelsForPage(page.id);

          if (!isMounted) return;

          // Get loaded panels for debugging
          const loadedPanels = useCanvasStore.getState().panels;
          console.log("[Project Restoration] Loaded panels:", loadedPanels.length, loadedPanels);
          
          // Validate panel data
          loadedPanels.forEach((panel, index) => {
            console.log(`[Project Restoration] Panel ${index}:`, {
              id: panel.id,
              position: { x: panel.x, y: panel.y },
              size: { width: panel.width, height: panel.height },
              hasImage: !!panel.imageUrl,
              imageUrl: panel.imageUrl,
            });
            
            // Warn about invalid coordinates
            if (isNaN(panel.x) || isNaN(panel.y)) {
              console.warn(`[Project Restoration] Panel ${panel.id} has invalid coordinates:`, panel.x, panel.y);
            }
            if (panel.width <= 0 || panel.height <= 0) {
              console.warn(`[Project Restoration] Panel ${panel.id} has invalid dimensions:`, panel.width, panel.height);
            }
          });

          // Restore canvas state (zoom, pan)
          console.log("[Project Restoration] Restoring canvas state...");
          restoreCanvasState(page.id);
        } else {
          console.warn("[Project Restoration] No current page found");
        }

        if (isMounted) {
          console.log("[Project Restoration] Restoration complete");
          setState({ isRestoring: false, error: null, isComplete: true });
        }
      } catch (error) {
        console.error("[Project Restoration] Error:", error);
        if (isMounted) {
          setState({
            isRestoring: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to restore project",
            isComplete: false,
          });
        }
      }
    };

    restoreProject();

    return () => {
      isMounted = false;
    };
  }, [projectId, loadProject, loadPanelsForPage, restoreCanvasState]);

  // Load panels when page changes
  useEffect(() => {
    if (!currentPage || state.isRestoring) return;

    const loadPagePanels = async () => {
      try {
        console.log("[Project Restoration] Page changed, loading panels for:", currentPage.id);
        await loadPanelsForPage(currentPage.id);
        
        const loadedPanels = useCanvasStore.getState().panels;
        console.log("[Project Restoration] Panels loaded after page change:", loadedPanels.length);
        
        restoreCanvasState(currentPage.id);
      } catch (error) {
        console.error("[Project Restoration] Failed to load panels for page:", error);
      }
    };

    loadPagePanels();
  }, [
    currentPage?.id,
    loadPanelsForPage,
    restoreCanvasState,
    state.isRestoring,
  ]);

  // Debug: Log panels state changes
  useEffect(() => {
    console.log("[Project Restoration] Panels state updated:", panels.length, "panels");
  }, [panels]);

  return state;
}
