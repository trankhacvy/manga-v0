"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store/editor-store";

interface UseEditorShortcutsOptions {
  onDeleteRequested?: () => void;
  onFocusPrompt?: () => void;
}

/**
 * Hook for handling keyboard shortcuts in the editor
 * Handles Delete key, Escape, Cmd+K, and arrow key nudging
 */
export function useEditorShortcuts({
  onDeleteRequested,
  onFocusPrompt,
}: UseEditorShortcutsOptions = {}) {
  const { selectedPanelIds, clearSelection, updatePanel, panels } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true";

      // Cmd+K or Ctrl+K - Focus global prompt input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (onFocusPrompt) {
          onFocusPrompt();
        }
        return;
      }

      // Delete or Backspace - Delete selected panels
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedPanelIds.length > 0 &&
        !isInputFocused
      ) {
        e.preventDefault();
        if (onDeleteRequested) {
          onDeleteRequested();
        }
        return;
      }

      // Escape - Clear selection
      if (e.key === "Escape") {
        clearSelection();
        // Also blur any focused input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      // Arrow keys - Nudge selected panels
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        selectedPanelIds.length > 0 &&
        !isInputFocused
      ) {
        e.preventDefault();
        handleNudge(e.key, e.shiftKey);
        return;
      }
    };

    const handleNudge = (key: string, shiftKey: boolean) => {
      const nudgeAmount = shiftKey ? 10 : 1;
      let deltaX = 0;
      let deltaY = 0;

      switch (key) {
        case "ArrowLeft":
          deltaX = -nudgeAmount;
          break;
        case "ArrowRight":
          deltaX = nudgeAmount;
          break;
        case "ArrowUp":
          deltaY = -nudgeAmount;
          break;
        case "ArrowDown":
          deltaY = nudgeAmount;
          break;
      }

      // Update all selected panels
      const selectedPanels = panels.filter((p) =>
        selectedPanelIds.includes(p.id)
      );

      selectedPanels.forEach((panel) => {
        updatePanel(panel.id, {
          x: panel.x + deltaX,
          y: panel.y + deltaY,
        });
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedPanelIds,
    clearSelection,
    updatePanel,
    panels,
    onDeleteRequested,
    onFocusPrompt,
  ]);
}
