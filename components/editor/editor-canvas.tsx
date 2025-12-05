"use client";

import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer } from "react-konva";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useEditorStore } from "@/lib/store/editor-store";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SPACING,
} from "@/lib/constants/page-dimensions";
import type Konva from "konva";

interface EditorCanvasProps {
  children?: React.ReactNode;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Infinite canvas component using React-Konva
 * Handles pan and zoom interactions
 * Fills available space in the container
 * Automatically centers viewport on content on initial load
 */
export function EditorCanvas({ children, onShowToast }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hasInitializedViewport, setHasInitializedViewport] = useState(false);

  const { zoom, canvasOffset, setZoom, setCanvasOffset, fitToView } =
    useCanvasStore();
  const { pages, panels } = useEditorStore();

  // Handle container sizing - fill available space
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // Initial size
    updateDimensions();

    // Update on window resize
    window.addEventListener("resize", updateDimensions);

    // Use ResizeObserver for more accurate container size tracking
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Center viewport on content on initial load
  useEffect(() => {
    // Only run once when dimensions are set and content is loaded
    if (
      !hasInitializedViewport &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      // Wait a frame to ensure dimensions are stable
      requestAnimationFrame(() => {
        if (pages.length > 0) {
          // Calculate bounds for all pages
          const pageBounds = pages.map((page, index) => {
            const yOffset =
              index *
              ((page.height || DEFAULT_PAGE_SIZE.height) + PAGE_SPACING);
            return {
              x: 0,
              y: yOffset,
              width: page.width || DEFAULT_PAGE_SIZE.width,
              height: page.height || DEFAULT_PAGE_SIZE.height,
            };
          });
          fitToView(pageBounds, dimensions.width, dimensions.height);
        } else if (panels.length > 0) {
          // Fallback to panels if no pages
          const panelBounds = panels.map((p) => ({
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
          }));
          fitToView(panelBounds, dimensions.width, dimensions.height);
        } else {
          // Handle empty canvas - reset to default view
          setZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
        }

        setHasInitializedViewport(true);
      });
    }
  }, [
    pages,
    panels,
    dimensions,
    hasInitializedViewport,
    fitToView,
    setZoom,
    setCanvasOffset,
  ]);

  // Handle Space key for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        if (containerRef.current) {
          containerRef.current.style.cursor = "grab";
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
        if (containerRef.current) {
          containerRef.current.style.cursor = "default";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Handle mouse wheel zoom (zoom toward cursor)
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom delta
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Clamp zoom between 0.1x and 3x
    const clampedScale = Math.min(3, Math.max(0.1, newScale));

    // Calculate new position to zoom toward cursor
    const mousePointTo = {
      x: (pointer.x - canvasOffset.x) / oldScale,
      y: (pointer.y - canvasOffset.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setZoom(clampedScale);
    setCanvasOffset(newPos);
  };

  // Handle panning with Space + Drag
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSpacePressed) {
      setIsPanning(true);
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    } else {
      // Click on empty canvas to clear selection
      const target = e.target;
      // Check if clicked on the stage itself (not on any shape)
      if (target === stageRef.current) {
        useEditorStore.getState().clearSelection();
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning || !isSpacePressed) return;

    const stage = stageRef.current;
    if (!stage) return;

    // Update canvas offset based on mouse movement
    const newOffset = {
      x: canvasOffset.x + e.evt.movementX,
      y: canvasOffset.y + e.evt.movementY,
    };

    setCanvasOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      if (containerRef.current && isSpacePressed) {
        containerRef.current.style.cursor = "grab";
      }
    }
  };

  // Handle character drop on canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    try {
      // Get character data from drag event
      const characterData = e.dataTransfer.getData("character");
      if (!characterData) return;

      const character = JSON.parse(characterData);

      // Get mouse position relative to canvas
      const stage = stageRef.current;
      if (!stage) return;

      // Calculate canvas coordinates from screen coordinates
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const canvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;

      // Find which panel (if any) the drop occurred on
      const droppedPanel = panels.find((panel) => {
        return (
          canvasX >= panel.x &&
          canvasX <= panel.x + panel.width &&
          canvasY >= panel.y &&
          canvasY <= panel.y + panel.height
        );
      });

      if (droppedPanel) {
        // Check if character handle already exists in panel
        const currentHandles = droppedPanel.characterHandles || [];
        if (currentHandles.includes(character.handle)) {
          onShowToast?.(`${character.name} is already in this panel`, "info");
          return;
        }

        // Add character handle to panel
        const updatedHandles = [...currentHandles, character.handle];

        // Update panel in store and database
        await useEditorStore
          .getState()
          .updatePanel(droppedPanel.id, { characterHandles: updatedHandles });

        onShowToast?.(`Added ${character.name} to panel`, "success");
        console.log(
          `Added character ${character.handle} to panel ${droppedPanel.id}`
        );
      } else {
        onShowToast?.("Drop character on a panel to add it", "info");
      }
    } catch (error) {
      console.error("Failed to add character to panel:", error);
      onShowToast?.("Failed to add character to panel", "error");
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 dark:bg-gray-900"
      style={{ overflow: "hidden" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        x={canvasOffset.x}
        y={canvasOffset.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        draggable={false}
      >
        <Layer>
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<any>, {
                onShowToast,
              })
            : children}
        </Layer>
      </Stage>
    </div>
  );
}
