"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { usePanelOperations } from "./use-panel-operations";

/**
 * Hook for handling panel deletion with confirmation
 * Shows confirmation dialog when deleting multiple panels
 * Automatically tracks history for undo/redo
 */
export function usePanelDeletion() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [panelsToDelete, setPanelsToDelete] = useState<string[]>([]);
  
  const { selectedPanelIds, clearSelection } = useEditorStore();
  const { deletePanelsWithHistory } = usePanelOperations();

  const requestDeleteSelectedPanels = useCallback(() => {
    if (selectedPanelIds.length === 0) return;

    // If multiple panels, show confirmation
    if (selectedPanelIds.length > 1) {
      setPanelsToDelete(selectedPanelIds);
      setShowConfirmDialog(true);
    } else {
      // Single panel, delete immediately with history tracking
      deletePanelsWithHistory(selectedPanelIds).catch((error) => {
        console.error("Failed to delete panel:", error);
      });
    }
  }, [selectedPanelIds, deletePanelsWithHistory]);

  const confirmDelete = useCallback(async () => {
    setShowConfirmDialog(false);
    
    try {
      await deletePanelsWithHistory(panelsToDelete);
      clearSelection();
    } catch (error) {
      console.error("Failed to delete panels:", error);
    }
    
    setPanelsToDelete([]);
  }, [panelsToDelete, deletePanelsWithHistory, clearSelection]);

  const cancelDelete = useCallback(() => {
    setShowConfirmDialog(false);
    setPanelsToDelete([]);
  }, []);

  return {
    showConfirmDialog,
    panelsToDelete,
    requestDeleteSelectedPanels,
    confirmDelete,
    cancelDelete,
  };
}
