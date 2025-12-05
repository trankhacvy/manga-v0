"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Rect } from "react-konva";
import { PanelCard } from "@/components/editor/panel-card";
import { PageContainer } from "@/components/editor/page-container";
import { LayoutTemplateSelector } from "@/components/editor/layout-template-selector";
import { useEditorStore } from "@/lib/store/editor-store";
import { usePanelNudging } from "@/lib/hooks/use-panel-nudging";
import { getLayoutById } from "@/lib/layout-templates";
import {
  calculateGridSegments,
  shouldSnapToSegment,
  calculateSnappedPosition,
} from "@/lib/utils/grid-segments";
import type { SpeechBubble } from "@/types";
import type { LayoutTemplate } from "@/types/layouts";

interface EditorCanvasContentProps {
  onAddBubbleRef?: React.MutableRefObject<(() => void) | null>;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Component that renders all panels on the canvas
 * Handles panel selection, click events, and dragging
 * Supports multi-panel dragging for selected panels
 */
export function EditorCanvasContent({
  onAddBubbleRef,
  onShowToast,
}: EditorCanvasContentProps = {}) {
  const {
    pages,
    panels,
    selectedPanelIds,
    selectPanel,
    togglePanelSelection,
    updatePanel,
    applyLayoutTemplate,
  } = useEditorStore();

  // Template selector modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedPageForTemplate, setSelectedPageForTemplate] = useState<
    string | null
  >(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // Track drag state for multi-panel dragging
  const draggedPanelIdRef = useRef<string | null>(null);
  const shiftKeyPressedRef = useRef<boolean>(false);
  const panelRefsRef = useRef<Map<string, unknown>>(new Map());
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Enable keyboard nudging with panel refs
  usePanelNudging({ panelRefs: panelRefsRef });

  // Track resize state
  const resizingPanelIdRef = useRef<string | null>(null);
  const resizeStateRef = useRef<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // Global bubble selection state
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  const handlePanelClick = (panelId: string, shiftKey: boolean) => {
    if (shiftKey) {
      // Multi-select with Shift+Click
      togglePanelSelection(panelId);
    } else {
      // Single select
      selectPanel(panelId);
    }
    // Deselect bubble when clicking on a different panel
    setSelectedBubbleId(null);
  };

  const handleBubbleSelect = (bubbleId: string | null) => {
    setSelectedBubbleId(bubbleId);
  };

  // Toast helper - use callback if provided, otherwise console.log
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      if (onShowToast) {
        onShowToast(message, type);
      } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    },
    [onShowToast]
  );

  // Track Shift key for snap override
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        shiftKeyPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        shiftKeyPressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle empty page state click
  const handleEmptyPageClick = (pageId: string) => {
    setSelectedPageForTemplate(pageId);
    setTemplateModalOpen(true);
  };

  // Handle template selection
  const handleSelectTemplate = async (template: LayoutTemplate) => {
    if (!selectedPageForTemplate) return;

    setIsApplyingTemplate(true);
    try {
      await applyLayoutTemplate(selectedPageForTemplate, template);
      setTemplateModalOpen(false);
      setSelectedPageForTemplate(null);
      console.log("Layout template applied successfully");
    } catch (error) {
      console.error("Failed to apply layout template:", error);
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Add bubble to selected panel
  const handleAddBubble = useCallback(async () => {
    // Only add bubble if exactly one panel is selected
    if (selectedPanelIds.length !== 1) {
      console.warn("Cannot add bubble: exactly one panel must be selected");
      return;
    }

    const panelId = selectedPanelIds[0];
    const panel = panels.find((p) => p.id === panelId);
    if (!panel) {
      console.error("Selected panel not found");
      return;
    }

    // Create new bubble with default size (150x80px) and center position
    const newBubble: SpeechBubble = {
      id: `bubble-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: (panel.width - 150) / 2, // Center horizontally
      y: (panel.height - 80) / 2, // Center vertically
      width: 150,
      height: 80,
      text: "New bubble",
      type: "standard",
    };

    // Add bubble to panel's bubbles array
    const updatedBubbles = [...panel.bubbles, newBubble];

    // Update panel in store and database
    try {
      await updatePanel(panelId, { bubbles: updatedBubbles });
      console.log("Bubble added successfully");
      // Select the newly added bubble
      setSelectedBubbleId(newBubble.id);
    } catch (error) {
      console.error("Failed to add bubble:", error);
    }
  }, [selectedPanelIds, panels, updatePanel]);

  // Delete bubble from panel (with history tracking)
  const handleDeleteBubble = useCallback(
    async (bubbleId: string) => {
      // Find which panel contains this bubble
      const panel = panels.find((p) =>
        p.bubbles.some((b) => b.id === bubbleId)
      );

      if (!panel) {
        console.error("Panel containing bubble not found");
        return;
      }

      // Use history-tracked deletion
      const { deleteBubble } = await import("@/lib/hooks/use-panel-operations");

      try {
        // Note: We need to get the store instance directly since we're in a callback
        const { useHistoryStore } = await import("@/lib/store/history-store");
        const { recordBubbleDelete } = useHistoryStore.getState();

        const bubble = panel.bubbles.find((b) => b.id === bubbleId);
        if (bubble) {
          recordBubbleDelete(panel.id, bubble);
        }

        const updatedBubbles = panel.bubbles.filter((b) => b.id !== bubbleId);
        await updatePanel(panel.id, { bubbles: updatedBubbles });

        console.log("Bubble deleted successfully");
        // Clear selection
        setSelectedBubbleId(null);
      } catch (error) {
        console.error("Failed to delete bubble:", error);
      }
    },
    [panels, updatePanel]
  );

  // Expose handleAddBubble to parent via ref
  useEffect(() => {
    if (onAddBubbleRef) {
      onAddBubbleRef.current = handleAddBubble;
    }
  }, [handleAddBubble, onAddBubbleRef]);

  // Handle Delete key for bubbles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBubbleId) {
        e.preventDefault();
        handleDeleteBubble(selectedBubbleId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBubbleId, handleDeleteBubble]);

  const handleDragStart = (panelId: string) => {
    draggedPanelIdRef.current = panelId;

    // Determine which panels to drag
    // If the dragged panel is already selected, drag all selected panels
    // If not, just drag this panel (it will be selected by the child component)
    let panelsToDrag: typeof panels;

    if (selectedPanelIds.includes(panelId)) {
      // Panel is already selected, drag all selected panels
      panelsToDrag = panels.filter((p) => selectedPanelIds.includes(p.id));
    } else {
      // Panel is not selected, just drag this one
      panelsToDrag = panels.filter((p) => p.id === panelId);
    }

    // Store initial positions
    const positionsMap = new Map<string, { x: number; y: number }>();
    panelsToDrag.forEach((panel) => {
      positionsMap.set(panel.id, { x: panel.x, y: panel.y });
    });
    initialPositionsRef.current = positionsMap;
  };

  const handleDragMove = (panelId: string, deltaX: number, deltaY: number) => {
    if (draggedPanelIdRef.current !== panelId) {
      return;
    }

    // Update positions of all OTHER panels that were captured in initialPositions (not the dragged one)
    initialPositionsRef.current.forEach((initialPos, otherPanelId) => {
      if (otherPanelId === panelId) return; // Skip the dragged panel itself

      const ref = panelRefsRef.current.get(otherPanelId) as
        | { position: (pos: { x: number; y: number }) => void }
        | undefined;
      if (ref) {
        // Update the Konva node position directly without triggering re-render
        ref.position({
          x: initialPos.x + deltaX,
          y: initialPos.y + deltaY,
        });
      }
    });
  };

  const handleDragEnd = async (panelId: string, newX: number, newY: number) => {
    if (draggedPanelIdRef.current !== panelId) {
      return;
    }

    draggedPanelIdRef.current = null;

    // Calculate the delta from the dragged panel
    const initialPos = initialPositionsRef.current.get(panelId);
    if (!initialPos) return;

    const deltaX = newX - initialPos.x;
    const deltaY = newY - initialPos.y;

    // Get the dragged panel
    const draggedPanel = panels.find((p) => p.id === panelId);
    if (!draggedPanel) return;

    // Get the page for snap-to-grid
    const page = pages.find((p) => p.id === draggedPanel.pageId);
    let snappedToGrid = false;

    // Check if we should snap to grid (only for single panel drag)
    if (
      page &&
      page.layoutTemplateId &&
      initialPositionsRef.current.size === 1 &&
      !shiftKeyPressedRef.current
    ) {
      const template = getLayoutById(page.layoutTemplateId);
      if (template) {
        const gridSegments = calculateGridSegments(
          template,
          page.width || 1654,
          page.height || 2339
        );

        const segmentToSnap = shouldSnapToSegment(
          newX,
          newY,
          draggedPanel.width,
          draggedPanel.height,
          gridSegments,
          true
        );

        if (segmentToSnap) {
          const snappedPos = calculateSnappedPosition(segmentToSnap);
          // Update panel with snapped position
          try {
            await updatePanel(panelId, snappedPos);
            // Delay toast slightly to avoid showing during re-render
            setTimeout(() => {
              showToast("Panel snapped to layout", "success");
            }, 100);
            snappedToGrid = true;
          } catch (error) {
            console.error("Failed to snap panel:", error);
          }
        }
      }
    }

    // If not snapped, save normal positions
    if (!snappedToGrid) {
      const savePromises: Promise<void>[] = [];

      initialPositionsRef.current.forEach((panelInitialPos, panelIdToSave) => {
        const finalX = panelInitialPos.x + deltaX;
        const finalY = panelInitialPos.y + deltaY;

        savePromises.push(
          updatePanel(panelIdToSave, {
            x: finalX,
            y: finalY,
          })
        );
      });

      try {
        await Promise.all(savePromises);
        console.log("All panel positions saved successfully");
      } catch (error) {
        console.error("Failed to save panel positions:", error);
      }
    }

    // Clear initial positions
    initialPositionsRef.current.clear();
  };

  const setPanelRef = (panelId: string, ref: unknown) => {
    if (ref) {
      panelRefsRef.current.set(panelId, ref);
    } else {
      panelRefsRef.current.delete(panelId);
    }
  };

  // Resize handlers
  const handleResizeStart = (panelId: string) => {
    resizingPanelIdRef.current = panelId;
    const panel = panels.find((p) => p.id === panelId);
    if (panel) {
      resizeStateRef.current = {
        width: panel.width,
        height: panel.height,
        x: panel.x,
        y: panel.y,
      };
    }
  };

  const handleResizeMove = (
    panelId: string,
    newWidth: number,
    newHeight: number,
    newX: number,
    newY: number
  ) => {
    if (resizingPanelIdRef.current !== panelId) return;

    // Store the current resize state for visual feedback
    resizeStateRef.current = {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY,
    };
  };

  const handleResizeEnd = async (
    panelId: string,
    newWidth: number,
    newHeight: number,
    newX: number,
    newY: number
  ) => {
    if (resizingPanelIdRef.current !== panelId) return;

    resizingPanelIdRef.current = null;
    resizeStateRef.current = null;

    // Update panel dimensions in store and database
    try {
      await updatePanel(panelId, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
      console.log("Panel dimensions saved successfully");
    } catch (error) {
      console.error("Failed to save panel dimensions:", error);
    }
  };

  // Group panels by page
  const panelsByPage = panels.reduce((acc, panel) => {
    if (!acc[panel.pageId]) {
      acc[panel.pageId] = [];
    }
    acc[panel.pageId].push(panel);
    return acc;
  }, {} as Record<string, typeof panels>);

  // If no pages, show empty state
  if (pages.length === 0) {
    return null;
  }

  return (
    <>
      {/* Invisible background rect to capture clicks on empty canvas */}
      <Rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="transparent"
        onClick={() => setSelectedBubbleId(null)}
        onTap={() => setSelectedBubbleId(null)}
        listening={true}
      />

      {/* Render each page with its panels */}
      {pages.map((page, index) => {
        const pagePanels = panelsByPage[page.id] || [];

        return (
          <PageContainer
            key={page.id}
            page={page}
            pageNumber={index}
            panels={pagePanels}
            layoutTemplateId={page.layoutTemplateId}
            onEmptyStateClick={() => handleEmptyPageClick(page.id)}
          >
            {pagePanels.map((panel) => (
              <PanelCard
                key={panel.id}
                panel={panel}
                isSelected={selectedPanelIds.includes(panel.id)}
                onClick={handlePanelClick}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onResizeStart={handleResizeStart}
                onResizeMove={handleResizeMove}
                onResizeEnd={handleResizeEnd}
                setPanelRef={setPanelRef}
                selectedBubbleId={selectedBubbleId}
                onBubbleSelect={handleBubbleSelect}
              />
            ))}
          </PageContainer>
        );
      })}

      {/* Layout Template Selector Modal - rendered outside canvas */}
      {templateModalOpen && (
        <LayoutTemplateSelector
          isOpen={templateModalOpen}
          onClose={() => {
            setTemplateModalOpen(false);
            setSelectedPageForTemplate(null);
          }}
          onSelectTemplate={handleSelectTemplate}
          isLoading={isApplyingTemplate}
        />
      )}
    </>
  );
}
