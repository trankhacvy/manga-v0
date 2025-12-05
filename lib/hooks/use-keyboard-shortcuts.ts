/**
 * Comprehensive keyboard shortcuts hook for the editor
 * Handles all keyboard interactions including:
 * - Canvas controls (Space, Escape, Cmd+K)
 * - Panel editing (Delete, Arrow keys for nudging)
 * - Copy/Paste (Cmd+C, Cmd+V, Cmd+D)
 * - Help modal (?)
 */

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { useClipboardStore } from "@/lib/store/clipboard-store";
import { useHistoryStore } from "@/lib/store/history-store";

interface UseKeyboardShortcutsOptions {
  onDeleteRequested?: () => void;
  onFocusPrompt?: () => void;
  onShowShortcuts?: () => void;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Check if user is currently typing in an input field
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === "INPUT" ||
    activeElement?.tagName === "TEXTAREA" ||
    activeElement?.getAttribute("contenteditable") === "true"
  );
}

export function useKeyboardShortcuts({
  onDeleteRequested,
  onFocusPrompt,
  onShowShortcuts,
  onShowToast,
}: UseKeyboardShortcutsOptions = {}) {
  const { selectedPanelIds, clearSelection, updatePanel, panels, getSelectedPanels } =
    useEditorStore();
  const { copyPanels, pastePanels, duplicatePanels } = useClipboardStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+Z - Undo
      if (modKey && e.key === "z" && !e.shiftKey && !isInputFocused()) {
        if (canUndo()) {
          e.preventDefault();
          undo()
            .then(() => {
              if (onShowToast) {
                onShowToast("Undone", "info");
              }
            })
            .catch((error) => {
              if (onShowToast) {
                onShowToast("Failed to undo", "error");
              }
            });
        }
        return;
      }

      // Cmd/Ctrl+Shift+Z - Redo
      if (modKey && e.key === "z" && e.shiftKey && !isInputFocused()) {
        if (canRedo()) {
          e.preventDefault();
          redo()
            .then(() => {
              if (onShowToast) {
                onShowToast("Redone", "info");
              }
            })
            .catch((error) => {
              if (onShowToast) {
                onShowToast("Failed to redo", "error");
              }
            });
        }
        return;
      }

      // Cmd/Ctrl+K - Focus global prompt input
      if (modKey && e.key === "k") {
        e.preventDefault();
        if (onFocusPrompt) {
          onFocusPrompt();
        }
        return;
      }

      // Cmd/Ctrl+C - Copy selected panels
      if (modKey && e.key === "c" && !isInputFocused()) {
        if (selectedPanelIds.length > 0) {
          e.preventDefault();
          const selectedPanels = getSelectedPanels();
          copyPanels(selectedPanels);
          if (onShowToast) {
            onShowToast(
              `Copied ${selectedPanels.length} panel${selectedPanels.length > 1 ? "s" : ""}`,
              "success"
            );
          }
        }
        return;
      }

      // Cmd/Ctrl+V - Paste panels
      if (modKey && e.key === "v" && !isInputFocused()) {
        e.preventDefault();
        pastePanels()
          .then(() => {
            if (onShowToast) {
              onShowToast("Panels pasted", "success");
            }
          })
          .catch((error) => {
            if (onShowToast) {
              onShowToast("Failed to paste panels", "error");
            }
          });
        return;
      }

      // Cmd/Ctrl+D - Duplicate selected panels
      if (modKey && e.key === "d" && !isInputFocused()) {
        if (selectedPanelIds.length > 0) {
          e.preventDefault();
          const selectedPanels = getSelectedPanels();
          duplicatePanels(selectedPanels)
            .then(() => {
              if (onShowToast) {
                onShowToast(
                  `Duplicated ${selectedPanels.length} panel${selectedPanels.length > 1 ? "s" : ""}`,
                  "success"
                );
              }
            })
            .catch((error) => {
              if (onShowToast) {
                onShowToast("Failed to duplicate panels", "error");
              }
            });
        }
        return;
      }

      // Delete or Backspace - Delete selected panels
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedPanelIds.length > 0 &&
        !isInputFocused()
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
        !isInputFocused()
      ) {
        e.preventDefault();
        handleNudge(e.key, e.shiftKey);
        return;
      }

      // ? - Show keyboard shortcuts
      if (e.key === "?" && !isInputFocused()) {
        e.preventDefault();
        if (onShowShortcuts) {
          onShowShortcuts();
        }
        return;
      }
    };

    /**
     * Nudge selected panels by arrow keys
     * Regular: 1px, Shift: 10px
     */
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
      const { recordPanelMove } = useHistoryStore.getState();

      selectedPanels.forEach((panel) => {
        const beforePanel = { ...panel };
        const afterPanel = {
          ...panel,
          x: panel.x + deltaX,
          y: panel.y + deltaY,
        };
        
        // Record history before updating
        recordPanelMove(panel.id, beforePanel, afterPanel);
        
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
    onShowShortcuts,
    onShowToast,
    getSelectedPanels,
    copyPanels,
    pastePanels,
    duplicatePanels,
    undo,
    redo,
    canUndo,
    canRedo,
  ]);
}
