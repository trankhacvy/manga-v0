import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/editor-store";

interface UsePanelNudgingOptions {
  panelRefs: React.MutableRefObject<Map<string, any>>;
}

/**
 * Hook for keyboard nudging of selected panels
 * - Arrow keys move selected panels 1px
 * - Shift + Arrow keys move 10px
 * - Works with multi-select
 * - Updates Konva nodes directly for smooth performance
 * - Debounces database saves
 * - Supports continuous movement when holding arrow keys
 */
export function usePanelNudging({ panelRefs }: UsePanelNudgingOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedDeltasRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        return;
      }

      // Get current state from store
      const store = useEditorStore.getState();
      const { selectedPanelIds, panels } = store;

      // Don't nudge if no panels are selected
      if (selectedPanelIds.length === 0) {
        return;
      }

      // Don't nudge if user is typing in an input field
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Prevent default arrow key behavior (scrolling)
      e.preventDefault();

      // Determine nudge distance based on shift key
      const nudgeDistance = e.shiftKey ? 10 : 1;

      // Calculate delta based on arrow key
      let deltaX = 0;
      let deltaY = 0;

      switch (e.key) {
        case "ArrowLeft":
          deltaX = -nudgeDistance;
          break;
        case "ArrowRight":
          deltaX = nudgeDistance;
          break;
        case "ArrowUp":
          deltaY = -nudgeDistance;
          break;
        case "ArrowDown":
          deltaY = nudgeDistance;
          break;
      }

      // Store initial positions on first keypress
      if (initialPositionsRef.current.size === 0) {
        selectedPanelIds.forEach((panelId) => {
          const panel = panels.find((p) => p.id === panelId);
          if (panel) {
            initialPositionsRef.current.set(panelId, { x: panel.x, y: panel.y });
            accumulatedDeltasRef.current.set(panelId, { x: 0, y: 0 });
          }
        });
      }

      // Update Konva nodes directly (no React re-render)
      selectedPanelIds.forEach((panelId) => {
        const ref = panelRefs.current.get(panelId);
        const initialPos = initialPositionsRef.current.get(panelId);
        const accumulated = accumulatedDeltasRef.current.get(panelId);

        if (ref && initialPos && accumulated) {
          // Accumulate deltas
          accumulated.x += deltaX;
          accumulated.y += deltaY;

          // Update Konva node position directly
          ref.position({
            x: initialPos.x + accumulated.x,
            y: initialPos.y + accumulated.y,
          });
        }
      });

      // Debounce database save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        // Save all accumulated changes to database
        const updates: Array<{ panelId: string; x: number; y: number }> = [];

        initialPositionsRef.current.forEach((initialPos, panelId) => {
          const accumulated = accumulatedDeltasRef.current.get(panelId);
          if (accumulated) {
            updates.push({
              panelId,
              x: initialPos.x + accumulated.x,
              y: initialPos.y + accumulated.y,
            });
          }
        });

        if (updates.length === 0) return;

        try {
          const { updatePanel } = useEditorStore.getState();

          await Promise.all(
            updates.map(({ panelId, x, y }) =>
              updatePanel(panelId, { x, y })
            )
          );

          console.log(`Saved ${updates.length} panel position(s) to database`);
        } catch (error) {
          console.error("Failed to save panel positions:", error);
        } finally {
          // Clear accumulated state
          initialPositionsRef.current.clear();
          accumulatedDeltasRef.current.clear();
        }
      }, 500); // 500ms debounce
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      // Clear timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [panelRefs]);
}
