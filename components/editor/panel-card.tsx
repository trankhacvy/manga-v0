"use client";

import React, { useEffect, useState, useRef } from "react";
import { Group, Rect, Image as KonvaImage, Circle, Arc } from "react-konva";
import type { Panel, SpeechBubble } from "@/types";
import { BubbleEditor } from "./bubble-editor";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { toast } from "sonner";

interface PanelCardProps {
  panel: Panel;
  isSelected?: boolean;
  onClick?: (panelId: string, shiftKey: boolean) => void;
  onDragStart?: (panelId: string) => void;
  onDragMove?: (panelId: string, deltaX: number, deltaY: number) => void;
  onDragEnd?: (panelId: string, newX: number, newY: number) => void;
  onResizeStart?: (panelId: string) => void;
  onResizeMove?: (
    panelId: string,
    newWidth: number,
    newHeight: number,
    newX: number,
    newY: number
  ) => void;
  onResizeEnd?: (
    panelId: string,
    newWidth: number,
    newHeight: number,
    newX: number,
    newY: number
  ) => void;
  setPanelRef?: (panelId: string, ref: any) => void;
  selectedBubbleId?: string | null;
  onBubbleSelect?: (bubbleId: string | null) => void;
}

/**
 * Panel component for rendering manga panels on the canvas
 * Uses Konva Group for panel container
 * Renders panel image using Konva Image
 * Shows panel border (1px gray)
 * Handles panel coordinates (x, y, width, height)
 * Supports dragging for selected panels
 */
export function PanelCard({
  panel,
  isSelected = false,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  setPanelRef,
  selectedBubbleId: externalSelectedBubbleId,
  onBubbleSelect,
}: PanelCardProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [spinnerRotation, setSpinnerRotation] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const groupRef = useRef<any>(null);

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<
    "tl" | "tr" | "bl" | "br" | null
  >(null);
  const [resizeStartState, setResizeStartState] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const [currentDimensions, setCurrentDimensions] = useState({
    x: panel.x,
    y: panel.y,
    width: panel.width,
    height: panel.height,
  });

  // Update current dimensions when panel prop changes (but not during resize)
  useEffect(() => {
    if (!isResizing) {
      setCurrentDimensions({
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
      });
    }
  }, [panel.x, panel.y, panel.width, panel.height, isResizing]);

  // Register ref with parent
  useEffect(() => {
    if (setPanelRef && groupRef.current) {
      setPanelRef(panel.id, groupRef.current);
    }
    return () => {
      if (setPanelRef) {
        setPanelRef(panel.id, null);
      }
    };
  }, [panel.id, setPanelRef]);

  // Handle resize mouse events on stage
  useEffect(() => {
    if (!isResizing || !groupRef.current) return;

    const stage = groupRef.current.getStage();
    if (!stage) return;

    const handleMouseMove = () => {
      if (!isResizing || !resizeHandle) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const deltaX = pointerPos.x - resizeStartState.mouseX;
      const deltaY = pointerPos.y - resizeStartState.mouseY;

      let newWidth = resizeStartState.width;
      let newHeight = resizeStartState.height;
      let newX = resizeStartState.x;
      let newY = resizeStartState.y;

      const MIN_SIZE = 100;

      // Calculate new dimensions based on which handle is being dragged
      switch (resizeHandle) {
        case "tl": // Top-left: adjust x, y, width, height
          newWidth = Math.max(MIN_SIZE, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height - deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "tr": // Top-right: adjust y, width, height
          newWidth = Math.max(MIN_SIZE, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height - deltaY);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "bl": // Bottom-left: adjust x, width, height
          newWidth = Math.max(MIN_SIZE, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height + deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          break;
        case "br": // Bottom-right: adjust width, height
          newWidth = Math.max(MIN_SIZE, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height + deltaY);
          break;
      }

      // Update local dimensions for visual feedback
      setCurrentDimensions({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });

      if (onResizeMove) {
        onResizeMove(panel.id, newWidth, newHeight, newX, newY);
      }
    };

    const handleMouseUp = () => {
      if (!isResizing || !resizeHandle) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const deltaX = pointerPos.x - resizeStartState.mouseX;
      const deltaY = pointerPos.y - resizeStartState.mouseY;

      let newWidth = resizeStartState.width;
      let newHeight = resizeStartState.height;
      let newX = resizeStartState.x;
      let newY = resizeStartState.y;

      const MIN_SIZE = 100;

      // Calculate final dimensions
      switch (resizeHandle) {
        case "tl":
          newWidth = Math.max(MIN_SIZE, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height - deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "tr":
          newWidth = Math.max(MIN_SIZE, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height - deltaY);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "bl":
          newWidth = Math.max(MIN_SIZE, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height + deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          break;
        case "br":
          newWidth = Math.max(MIN_SIZE, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStartState.height + deltaY);
          break;
      }

      setIsResizing(false);
      setResizeHandle(null);

      if (onResizeEnd) {
        onResizeEnd(panel.id, newWidth, newHeight, newX, newY);
      }
    };

    stage.on("mousemove", handleMouseMove);
    stage.on("mouseup", handleMouseUp);

    return () => {
      stage.off("mousemove", handleMouseMove);
      stage.off("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeHandle,
    resizeStartState,
    panel.id,
    onResizeMove,
    onResizeEnd,
  ]);

  // Animate spinner rotation
  useEffect(() => {
    if (imageStatus === "loading") {
      const animate = () => {
        setSpinnerRotation((prev) => (prev + 5) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageStatus]);

  // Load panel image with retry mechanism
  useEffect(() => {
    if (!panel.imageUrl) {
      setImageStatus("error");
      return;
    }

    const loadImage = (attemptNumber: number) => {
      setImageStatus("loading");

      const img = new window.Image();
      img.crossOrigin = "anonymous"; // Handle CORS

      img.onload = () => {
        setImage(img);
        setImageStatus("loaded");
        imageRef.current = img;
        setRetryCount(0);
      };

      img.onerror = () => {
        console.error(
          `Failed to load image for panel ${panel.id} (attempt ${
            attemptNumber + 1
          }/3):`,
          panel.imageUrl
        );

        // Retry with exponential backoff (max 3 attempts)
        if (attemptNumber < 2) {
          const backoffDelay = Math.pow(2, attemptNumber) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${backoffDelay}ms...`);

          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(attemptNumber + 1);
            loadImage(attemptNumber + 1);
          }, backoffDelay);
        } else {
          setImageStatus("error");
          console.error(
            `Failed to load image for panel ${panel.id} after 3 attempts`
          );
          toast.error("Failed to load panel image", {
            description: "Click the retry button on the panel to try again",
          });
        }
      };

      img.src = panel.imageUrl || "";
    };

    loadImage(retryCount);

    // Cleanup
    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [panel.imageUrl, panel.id, retryCount]);

  const handleClick = (e: any) => {
    if (onClick && !isDragging) {
      onClick(panel.id, e.evt.shiftKey);
    }
    // Deselect bubble when clicking on panel background
    if (onBubbleSelect) {
      onBubbleSelect(null);
    }
  };

  const handleRetryClick = (e: any) => {
    e.cancelBubble = true; // Prevent panel selection
    toast.info("Retrying image load...");
    setRetryCount(0); // Reset retry count to trigger reload
  };

  // Drag handlers
  const handleDragStart = (e: any) => {
    // If panel is not selected, select it first
    if (!isSelected && onClick) {
      onClick(panel.id, e.evt.shiftKey);
    }

    setIsDragging(true);
    const pos = e.target.position();
    setDragStartPos({ x: pos.x, y: pos.y });

    if (onDragStart) {
      onDragStart(panel.id);
    }
  };

  const handleDragMove = (e: any) => {
    const pos = e.target.position();
    const deltaX = pos.x - dragStartPos.x;
    const deltaY = pos.y - dragStartPos.y;

    if (onDragMove) {
      onDragMove(panel.id, deltaX, deltaY);
    }
  };

  const handleDragEnd = (e: any) => {
    setIsDragging(false);

    if (onDragEnd) {
      const pos = e.target.position();
      onDragEnd(panel.id, pos.x, pos.y);
    }
  };

  // Resize handlers
  const handleResizeStart = (handle: "tl" | "tr" | "bl" | "br", e: any) => {
    e.cancelBubble = true; // Prevent panel drag

    setIsResizing(true);
    setResizeHandle(handle);

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    setResizeStartState({
      x: currentDimensions.x,
      y: currentDimensions.y,
      width: currentDimensions.width,
      height: currentDimensions.height,
      mouseX: pointerPos.x,
      mouseY: pointerPos.y,
    });

    if (onResizeStart) {
      onResizeStart(panel.id);
    }
  };
  const centerX = currentDimensions.width / 2;
  const centerY = currentDimensions.height / 2;

  // Get zoom and canvas offset from canvas store
  const { zoom, canvasOffset } = useCanvasStore();
  const { updatePanel } = useEditorStore();

  // Handle bubble text change
  const handleBubbleTextChange = async (bubbleId: string, newText: string) => {
    // Update bubble text in panel's bubbles array
    const updatedBubbles = panel.bubbles.map((bubble) =>
      bubble.id === bubbleId ? { ...bubble, text: newText } : bubble
    );

    // Update panel in store and database
    await updatePanel(panel.id, { bubbles: updatedBubbles });
  };

  // Handle bubble position change
  const handleBubblePositionChange = async (
    bubbleId: string,
    newX: number,
    newY: number
  ) => {
    // Update bubble position in panel's bubbles array
    const updatedBubbles = panel.bubbles.map((bubble) =>
      bubble.id === bubbleId ? { ...bubble, x: newX, y: newY } : bubble
    );

    // Update panel in store and database
    await updatePanel(panel.id, { bubbles: updatedBubbles });
  };

  // Handle bubble size change
  const handleBubbleSizeChange = async (
    bubbleId: string,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ) => {
    // Update bubble dimensions in panel's bubbles array
    const updatedBubbles = panel.bubbles.map((bubble) =>
      bubble.id === bubbleId
        ? { ...bubble, x: newX, y: newY, width: newWidth, height: newHeight }
        : bubble
    );

    // Update panel in store and database
    await updatePanel(panel.id, { bubbles: updatedBubbles });
  };

  // Handle bubble click
  const handleBubbleClick = (bubbleId: string) => {
    if (onBubbleSelect) {
      onBubbleSelect(bubbleId);
    }
  };

  // Handle character drop on panel
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // setIsDragOver(false);

    try {
      // Get character data from drag event
      const characterData = e.dataTransfer.getData("character");
      if (!characterData) return;

      const character = JSON.parse(characterData);

      // Check if character handle already exists in panel
      const currentHandles = panel.characterHandles || [];
      if (currentHandles.includes(character.handle)) {
        console.log(`Character ${character.handle} already in panel`);
        return;
      }

      // Add character handle to panel
      const updatedHandles = [...currentHandles, character.handle];

      // Update panel in store and database
      await updatePanel(panel.id, { characterHandles: updatedHandles });

      console.log(`Added character ${character.handle} to panel ${panel.id}`);
    } catch (error) {
      console.error("Failed to add character to panel:", error);
    }
  };

  return (
    <Group
      ref={groupRef}
      x={currentDimensions.x}
      y={currentDimensions.y}
      width={currentDimensions.width}
      height={currentDimensions.height}
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      opacity={isDragging ? 0.7 : 1}
    >
      {/* Invisible clickable rectangle to capture clicks */}
      <Rect
        width={currentDimensions.width}
        height={currentDimensions.height}
        fill="transparent"
        onClick={handleClick}
        onTap={handleClick}
        listening={true}
      />

      {/* Panel image or placeholder */}
      {imageStatus === "loaded" && image ? (
        <KonvaImage
          image={image}
          width={currentDimensions.width}
          height={currentDimensions.height}
          listening={false}
        />
      ) : imageStatus === "loading" ? (
        <>
          {/* Loading placeholder - gray rectangle */}
          <Rect
            width={currentDimensions.width}
            height={currentDimensions.height}
            fill="#e5e7eb"
            listening={false}
          />
          {/* Loading spinner */}
          <Group x={centerX} y={centerY}>
            <Circle
              radius={20}
              fill="#ffffff"
              opacity={0.9}
              listening={false}
            />
            <Arc
              innerRadius={12}
              outerRadius={16}
              angle={90}
              rotation={spinnerRotation}
              fill="#3b82f6"
              listening={false}
            />
          </Group>
        </>
      ) : (
        <>
          {/* Error state - light red rectangle */}
          <Rect
            width={currentDimensions.width}
            height={currentDimensions.height}
            fill="#fee2e2"
            listening={false}
          />
          {/* Retry icon - circular button with refresh symbol */}
          <Group
            x={centerX}
            y={centerY}
            onClick={handleRetryClick}
            onTap={handleRetryClick}
          >
            <Circle radius={24} fill="#ef4444" opacity={0.9} listening={true} />
            {/* Refresh arrow (simplified) */}
            <Arc
              innerRadius={12}
              outerRadius={16}
              angle={270}
              rotation={45}
              fill="#ffffff"
              listening={false}
            />
            {/* Arrow head */}
            <Rect
              x={12}
              y={-18}
              width={6}
              height={6}
              fill="#ffffff"
              rotation={45}
              listening={false}
            />
          </Group>
        </>
      )}

      {/* Panel border (1px gray) */}
      <Rect
        width={currentDimensions.width}
        height={currentDimensions.height}
        stroke="#9ca3af"
        strokeWidth={1}
        listening={false}
      />

      {/* Error border (red) - shown when error */}
      {imageStatus === "error" && (
        <Rect
          width={currentDimensions.width}
          height={currentDimensions.height}
          stroke="#ef4444"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Selection border (3px blue) - shown when selected */}
      {isSelected && (
        <Rect
          width={currentDimensions.width}
          height={currentDimensions.height}
          stroke="#3b82f6"
          strokeWidth={3}
          listening={false}
        />
      )}

      {/* Dim overlay for non-selected panels (optional) - rendered on top to create dimming effect */}
      {!isSelected && (
        <Rect
          width={currentDimensions.width}
          height={currentDimensions.height}
          fill="#000000"
          opacity={0.15}
          listening={false}
        />
      )}

      {/* Speech bubbles - rendered on top of panel image */}
      {panel.bubbles && panel.bubbles.length > 0 && (
        <>
          {panel.bubbles.map((bubble) => (
            <BubbleEditor
              key={bubble.id}
              bubble={bubble}
              panelWidth={currentDimensions.width}
              panelHeight={currentDimensions.height}
              panelX={currentDimensions.x}
              panelY={currentDimensions.y}
              zoom={zoom}
              canvasOffsetX={canvasOffset.x}
              canvasOffsetY={canvasOffset.y}
              isSelected={externalSelectedBubbleId === bubble.id}
              onClick={handleBubbleClick}
              onDoubleClick={(bubbleId) => {
                console.log(`Bubble ${bubbleId} double-clicked for editing`);
              }}
              onTextChange={handleBubbleTextChange}
              onPositionChange={handleBubblePositionChange}
              onSizeChange={handleBubbleSizeChange}
            />
          ))}
        </>
      )}

      {/* Resize handles - shown when selected */}
      {isSelected && (
        <>
          {/* Top-left handle */}
          <Circle
            x={0}
            y={0}
            radius={6}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
            listening={true}
            draggable={false}
            onMouseDown={(e) => handleResizeStart("tl", e)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "nwse-resize";
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
          />
          {/* Top-right handle */}
          <Circle
            x={currentDimensions.width}
            y={0}
            radius={6}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
            listening={true}
            draggable={false}
            onMouseDown={(e) => handleResizeStart("tr", e)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "nesw-resize";
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
          />
          {/* Bottom-left handle */}
          <Circle
            x={0}
            y={currentDimensions.height}
            radius={6}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
            listening={true}
            draggable={false}
            onMouseDown={(e) => handleResizeStart("bl", e)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "nesw-resize";
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
          />
          {/* Bottom-right handle */}
          <Circle
            x={currentDimensions.width}
            y={currentDimensions.height}
            radius={6}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
            listening={true}
            draggable={false}
            onMouseDown={(e) => handleResizeStart("br", e)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "nwse-resize";
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
          />
        </>
      )}
    </Group>
  );
}
