"use client";

import React, { useState, useRef, useEffect } from "react";
import { Group, Rect, Text, Circle, Shape } from "react-konva";
import type { SpeechBubble } from "@/types";
import { getBubbleType, type BubbleTypeDefinition } from "@/lib/bubble-types";

interface BubbleEditorProps {
  bubble: SpeechBubble;
  panelWidth: number;
  panelHeight: number;
  panelX: number;
  panelY: number;
  zoom: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  isSelected?: boolean;
  onClick?: (bubbleId: string) => void;
  onDoubleClick?: (bubbleId: string) => void;
  onTextChange?: (bubbleId: string, newText: string) => void;
  onPositionChange?: (bubbleId: string, newX: number, newY: number) => void;
  onSizeChange?: (
    bubbleId: string,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ) => void;
}

/**
 * BubbleEditor Component
 *
 * Renders speech bubbles on panels using Konva.
 * Supports different bubble types: standard, shout, whisper, thought
 * Positions bubbles relative to parent panel
 * Supports double-click to edit text with HTML textarea overlay
 */
export function BubbleEditor({
  bubble,
  panelWidth,
  panelHeight,
  panelX,
  panelY,
  zoom,
  canvasOffsetX,
  canvasOffsetY,
  isSelected = false,
  onClick,
  onDoubleClick,
  onTextChange,
  onPositionChange,
  onSizeChange,
}: BubbleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(bubble.text);
  const lastClickTimeRef = useRef<number>(0);
  const groupRef = useRef<any>(null);
  const justUpdatedPositionRef = useRef(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

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
    x: bubble.x,
    y: bubble.y,
    width: bubble.width,
    height: bubble.height,
  });

  // Get bubble type definition for styling
  const bubbleTypeDef = getBubbleType(bubble.type) || getBubbleType("standard");

  if (!bubbleTypeDef) {
    console.warn(`Unknown bubble type: ${bubble.type}`);
    return null;
  }

  // Update editText when bubble text changes externally
  useEffect(() => {
    setEditText(bubble.text);
  }, [bubble.text]);

  // Update current dimensions when bubble prop changes (but not during resize/drag)
  useEffect(() => {
    if (!isResizing && !isDragging) {
      // Skip update if we just set the position locally
      if (justUpdatedPositionRef.current) {
        justUpdatedPositionRef.current = false;
        return;
      }

      setCurrentDimensions({
        x: bubble.x,
        y: bubble.y,
        width: bubble.width,
        height: bubble.height,
      });
    }
  }, [bubble.x, bubble.y, bubble.width, bubble.height, isResizing, isDragging]);

  // Handle resize mouse events on stage
  useEffect(() => {
    if (!isResizing || !groupRef.current) return;

    const stage = groupRef.current.getStage();
    if (!stage) return;

    const handleMouseMove = () => {
      if (!isResizing || !resizeHandle) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Convert pointer position to panel-relative coordinates
      const relativeX = (pointerPos.x - canvasOffsetX) / zoom - panelX;
      const relativeY = (pointerPos.y - canvasOffsetY) / zoom - panelY;

      const deltaX = relativeX - resizeStartState.mouseX;
      const deltaY = relativeY - resizeStartState.mouseY;

      let newWidth = resizeStartState.width;
      let newHeight = resizeStartState.height;
      let newX = resizeStartState.x;
      let newY = resizeStartState.y;

      const MIN_WIDTH = 50;
      const MIN_HEIGHT = 30;

      // Calculate new dimensions based on which handle is being dragged
      switch (resizeHandle) {
        case "tl": // Top-left: adjust x, y, width, height
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height - deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "tr": // Top-right: adjust y, width, height
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height - deltaY);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "bl": // Bottom-left: adjust x, width, height
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height + deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          break;
        case "br": // Bottom-right: adjust width, height
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height + deltaY);
          break;
      }

      // Keep bubble within panel bounds
      newX = Math.max(0, Math.min(newX, panelWidth - newWidth));
      newY = Math.max(0, Math.min(newY, panelHeight - newHeight));

      // Adjust width/height if position was constrained
      if (newX === 0 && resizeHandle === "tl") {
        newWidth = resizeStartState.x + resizeStartState.width;
      }
      if (newX === 0 && resizeHandle === "bl") {
        newWidth = resizeStartState.x + resizeStartState.width;
      }
      if (newY === 0 && resizeHandle === "tl") {
        newHeight = resizeStartState.y + resizeStartState.height;
      }
      if (newY === 0 && resizeHandle === "tr") {
        newHeight = resizeStartState.y + resizeStartState.height;
      }

      // Ensure bubble doesn't exceed panel bounds
      newWidth = Math.min(newWidth, panelWidth - newX);
      newHeight = Math.min(newHeight, panelHeight - newY);

      // Update local dimensions for visual feedback
      setCurrentDimensions({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      if (!isResizing || !resizeHandle) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Convert pointer position to panel-relative coordinates
      const relativeX = (pointerPos.x - canvasOffsetX) / zoom - panelX;
      const relativeY = (pointerPos.y - canvasOffsetY) / zoom - panelY;

      const deltaX = relativeX - resizeStartState.mouseX;
      const deltaY = relativeY - resizeStartState.mouseY;

      let newWidth = resizeStartState.width;
      let newHeight = resizeStartState.height;
      let newX = resizeStartState.x;
      let newY = resizeStartState.y;

      const MIN_WIDTH = 50;
      const MIN_HEIGHT = 30;

      // Calculate final dimensions
      switch (resizeHandle) {
        case "tl":
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height - deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "tr":
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height - deltaY);
          newY = resizeStartState.y + (resizeStartState.height - newHeight);
          break;
        case "bl":
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width - deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height + deltaY);
          newX = resizeStartState.x + (resizeStartState.width - newWidth);
          break;
        case "br":
          newWidth = Math.max(MIN_WIDTH, resizeStartState.width + deltaX);
          newHeight = Math.max(MIN_HEIGHT, resizeStartState.height + deltaY);
          break;
      }

      // Keep bubble within panel bounds
      newX = Math.max(0, Math.min(newX, panelWidth - newWidth));
      newY = Math.max(0, Math.min(newY, panelHeight - newHeight));

      // Adjust width/height if position was constrained
      if (newX === 0 && resizeHandle === "tl") {
        newWidth = resizeStartState.x + resizeStartState.width;
      }
      if (newX === 0 && resizeHandle === "bl") {
        newWidth = resizeStartState.x + resizeStartState.width;
      }
      if (newY === 0 && resizeHandle === "tl") {
        newHeight = resizeStartState.y + resizeStartState.height;
      }
      if (newY === 0 && resizeHandle === "tr") {
        newHeight = resizeStartState.y + resizeStartState.height;
      }

      // Ensure bubble doesn't exceed panel bounds
      newWidth = Math.min(newWidth, panelWidth - newX);
      newHeight = Math.min(newHeight, panelHeight - newY);

      setIsResizing(false);
      setResizeHandle(null);

      if (onSizeChange) {
        onSizeChange(bubble.id, newX, newY, newWidth, newHeight);
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
    bubble.id,
    panelWidth,
    panelHeight,
    panelX,
    panelY,
    zoom,
    canvasOffsetX,
    canvasOffsetY,
    onSizeChange,
  ]);

  const handleClick = (e: any) => {
    // Stop event propagation to prevent panel click
    e.cancelBubble = true;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    // Detect double-click (within 300ms)
    if (timeSinceLastClick < 300) {
      handleDoubleClick();
    } else if (onClick) {
      onClick(bubble.id);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    if (onDoubleClick) {
      onDoubleClick(bubble.id);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };

  const handleSave = () => {
    if (onTextChange && editText !== bubble.text) {
      onTextChange(bubble.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(bubble.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // Drag handlers
  const handleDragStart = (e: any) => {
    // Prevent dragging when editing text
    if (isEditing) {
      e.cancelBubble = true;
      return;
    }

    // Stop event propagation to prevent panel from dragging
    e.cancelBubble = true;

    // Select bubble on drag start
    if (onClick) {
      onClick(bubble.id);
    }

    setIsDragging(true);
    const pos = e.target.position();
    setDragStartPos({ x: pos.x, y: pos.y });
  };

  const handleDragMove = (e: any) => {
    const pos = e.target.position();

    // Constrain bubble within panel bounds during drag
    const constrainedX = Math.max(
      0,
      Math.min(pos.x, panelWidth - currentDimensions.width)
    );
    const constrainedY = Math.max(
      0,
      Math.min(pos.y, panelHeight - currentDimensions.height)
    );

    // Update position to constrained values
    e.target.position({ x: constrainedX, y: constrainedY });

    // Update local state
    setCurrentDimensions({
      ...currentDimensions,
      x: constrainedX,
      y: constrainedY,
    });
  };

  const handleDragEnd = (e: any) => {
    const pos = e.target.position();

    // Constrain final position within panel bounds
    const constrainedX = Math.max(
      0,
      Math.min(pos.x, panelWidth - currentDimensions.width)
    );
    const constrainedY = Math.max(
      0,
      Math.min(pos.y, panelHeight - currentDimensions.height)
    );

    // Mark that we're updating position locally
    justUpdatedPositionRef.current = true;

    // Update local state to persist the new position
    setCurrentDimensions({
      ...currentDimensions,
      x: constrainedX,
      y: constrainedY,
    });

    // Set isDragging to false
    setIsDragging(false);

    if (onPositionChange) {
      onPositionChange(bubble.id, constrainedX, constrainedY);
    }
  };

  // Resize handlers
  const handleResizeStart = (handle: "tl" | "tr" | "bl" | "br", e: any) => {
    e.cancelBubble = true; // Prevent bubble drag

    // Select bubble on resize start
    if (onClick) {
      onClick(bubble.id);
    }

    setIsResizing(true);
    setResizeHandle(handle);

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // Convert pointer position to panel-relative coordinates
    const relativeX = (pointerPos.x - canvasOffsetX) / zoom - panelX;
    const relativeY = (pointerPos.y - canvasOffsetY) / zoom - panelY;

    setResizeStartState({
      x: currentDimensions.x,
      y: currentDimensions.y,
      width: currentDimensions.width,
      height: currentDimensions.height,
      mouseX: relativeX,
      mouseY: relativeY,
    });
  };

  // Use current dimensions for positioning
  const constrainedX = currentDimensions.x;
  const constrainedY = currentDimensions.y;

  // Calculate absolute position for textarea overlay
  // Account for panel position, bubble position, zoom, and canvas offset
  const absoluteX = (panelX + constrainedX) * zoom + canvasOffsetX;
  const absoluteY = (panelY + constrainedY) * zoom + canvasOffsetY;
  const scaledWidth = currentDimensions.width * zoom;
  const scaledHeight = currentDimensions.height * zoom;

  // Manage textarea DOM element with useEffect
  useEffect(() => {
    if (!isEditing || typeof document === "undefined") return;

    let currentEditText = editText;

    // Create textarea element
    const textarea = document.createElement("textarea");
    textarea.value = currentEditText;
    textarea.style.position = "fixed"; // Use fixed positioning relative to viewport
    textarea.style.left = `${absoluteX}px`;
    textarea.style.top = `${absoluteY}px`;
    textarea.style.width = `${scaledWidth}px`;
    textarea.style.height = `${scaledHeight}px`;
    textarea.style.fontSize = `${bubbleTypeDef.defaultStyle.fontSize * zoom}px`;
    textarea.style.fontFamily = bubbleTypeDef.defaultStyle.fontFamily;
    textarea.style.fontWeight = bubbleTypeDef.defaultStyle.fontWeight;
    textarea.style.textAlign = bubbleTypeDef.defaultStyle.textAlign;
    textarea.style.color = bubbleTypeDef.defaultStyle.textColor;
    textarea.style.backgroundColor = bubbleTypeDef.defaultStyle.backgroundColor;
    textarea.style.border = "2px solid #3b82f6";
    textarea.style.borderRadius = "4px";
    textarea.style.padding = `${bubbleTypeDef.defaultStyle.padding * zoom}px`;
    textarea.style.resize = "none";
    textarea.style.overflow = "auto";
    textarea.style.zIndex = "1000";
    textarea.style.boxSizing = "border-box";

    // Event handlers
    const handleChange = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      currentEditText = target.value;
      setEditText(target.value);
    };

    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Save logic inline to avoid closure issues
        if (onTextChange && currentEditText !== bubble.text) {
          onTextChange(bubble.id, currentEditText);
        }
        setIsEditing(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        // Cancel logic inline
        setEditText(bubble.text);
        setIsEditing(false);
      }
    };

    const handleBlur = () => {
      // Save logic inline to avoid closure issues
      if (onTextChange && currentEditText !== bubble.text) {
        onTextChange(bubble.id, currentEditText);
      }
      setIsEditing(false);
    };

    textarea.addEventListener("input", handleChange);
    textarea.addEventListener("keydown", handleKeyDownEvent);
    textarea.addEventListener("blur", handleBlur);

    // Append to body
    document.body.appendChild(textarea);

    // Focus and select
    textarea.focus();
    textarea.select();

    // Cleanup
    return () => {
      textarea.removeEventListener("input", handleChange);
      textarea.removeEventListener("keydown", handleKeyDownEvent);
      textarea.removeEventListener("blur", handleBlur);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };
  }, [
    isEditing,
    absoluteX,
    absoluteY,
    scaledWidth,
    scaledHeight,
    zoom,
    bubbleTypeDef.defaultStyle,
    bubble.id,
    bubble.text,
    onTextChange,
  ]);

  return (
    <Group
      ref={groupRef}
      x={constrainedX}
      y={constrainedY}
      draggable={isSelected && !isEditing && !isResizing}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      opacity={isDragging ? 0.7 : 1}
    >
      {/* Render bubble shape based on type */}
      {renderBubbleShape(
        {
          ...bubble,
          width: currentDimensions.width,
          height: currentDimensions.height,
        },
        bubbleTypeDef,
        isSelected
      )}

      {/* Render text inside bubble (hide when editing) */}
      {!isEditing &&
        renderBubbleText(
          {
            ...bubble,
            width: currentDimensions.width,
            height: currentDimensions.height,
          },
          bubbleTypeDef
        )}

      {/* Selection indicator */}
      {isSelected && (
        <Rect
          width={currentDimensions.width}
          height={currentDimensions.height}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Resize handles - shown when selected */}
      {isSelected && !isEditing && (
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

/**
 * Render bubble shape based on bubble type
 */
function renderBubbleShape(
  bubble: SpeechBubble,
  bubbleTypeDef: BubbleTypeDefinition,
  isSelected: boolean
) {
  const style = bubbleTypeDef.defaultStyle;
  const { width, height } = bubble;

  switch (bubbleTypeDef.shape) {
    case "ellipse":
      return renderEllipseBubble(width, height, style, isSelected);

    case "cloud":
      return renderCloudBubble(width, height, style, isSelected);

    case "jagged":
      return renderJaggedBubble(width, height, style, isSelected);

    case "whisper":
      return renderWhisperBubble(width, height, style, isSelected);

    case "rectangle":
      return renderRectangleBubble(width, height, style, isSelected);

    default:
      return renderEllipseBubble(width, height, style, isSelected);
  }
}

/**
 * Render standard ellipse/rounded rectangle bubble
 */
function renderEllipseBubble(
  width: number,
  height: number,
  style: any,
  isSelected: boolean
) {
  return (
    <Rect
      width={width}
      height={height}
      fill={style.backgroundColor}
      stroke={style.borderColor}
      strokeWidth={style.borderWidth}
      cornerRadius={Math.min(width, height) * 0.3}
      listening={true}
      shadowColor={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.1)"}
      shadowBlur={isSelected ? 8 : 4}
      shadowOpacity={isSelected ? 0.5 : 0.3}
    />
  );
}

/**
 * Render cloud-shaped thought bubble
 */
function renderCloudBubble(
  width: number,
  height: number,
  style: any,
  isSelected: boolean
) {
  // Create cloud shape using multiple circles
  const numBumps = 8;
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  return (
    <Group>
      {/* Main ellipse background */}
      <Rect
        width={width}
        height={height}
        fill={style.backgroundColor}
        stroke={style.borderColor}
        strokeWidth={style.borderWidth}
        cornerRadius={Math.min(width, height) * 0.4}
        listening={true}
        shadowColor={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.1)"}
        shadowBlur={isSelected ? 8 : 4}
        shadowOpacity={isSelected ? 0.5 : 0.3}
      />

      {/* Cloud bumps around the edge */}
      {Array.from({ length: numBumps }).map((_, i) => {
        const angle = (i / numBumps) * Math.PI * 2;
        const bumpRadius = Math.min(width, height) * 0.12;
        const x = centerX + Math.cos(angle) * (radiusX - bumpRadius * 0.5);
        const y = centerY + Math.sin(angle) * (radiusY - bumpRadius * 0.5);

        return (
          <Circle
            key={i}
            x={x}
            y={y}
            radius={bumpRadius}
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth * 0.8}
            listening={false}
          />
        );
      })}
    </Group>
  );
}

/**
 * Render jagged/spiky shout bubble
 */
function renderJaggedBubble(
  width: number,
  height: number,
  style: any,
  isSelected: boolean
) {
  // Create jagged edge using custom shape
  const spikeSize = Math.min(width, height) * 0.08;
  const numSpikes = 12;

  return (
    <Shape
      sceneFunc={(context, shape) => {
        context.beginPath();

        // Create jagged path around rectangle
        const points: Array<{ x: number; y: number }> = [];

        // Top edge
        for (let i = 0; i <= numSpikes / 4; i++) {
          const x = (i / (numSpikes / 4)) * width;
          const y = i % 2 === 0 ? 0 : spikeSize;
          points.push({ x, y });
        }

        // Right edge
        for (let i = 0; i <= numSpikes / 4; i++) {
          const x = i % 2 === 0 ? width : width - spikeSize;
          const y = (i / (numSpikes / 4)) * height;
          points.push({ x, y });
        }

        // Bottom edge
        for (let i = numSpikes / 4; i >= 0; i--) {
          const x = (i / (numSpikes / 4)) * width;
          const y = i % 2 === 0 ? height : height - spikeSize;
          points.push({ x, y });
        }

        // Left edge
        for (let i = numSpikes / 4; i >= 0; i--) {
          const x = i % 2 === 0 ? 0 : spikeSize;
          const y = (i / (numSpikes / 4)) * height;
          points.push({ x, y });
        }

        // Draw the path
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          context.lineTo(points[i].x, points[i].y);
        }
        context.closePath();

        context.fillStrokeShape(shape);
      }}
      fill={style.backgroundColor}
      stroke={style.borderColor}
      strokeWidth={style.borderWidth}
      listening={true}
      shadowColor={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.1)"}
      shadowBlur={isSelected ? 8 : 4}
      shadowOpacity={isSelected ? 0.5 : 0.3}
    />
  );
}

/**
 * Render whisper bubble with dashed border
 */
function renderWhisperBubble(
  width: number,
  height: number,
  style: any,
  isSelected: boolean
) {
  return (
    <Rect
      width={width}
      height={height}
      fill={style.backgroundColor}
      stroke={style.borderColor}
      strokeWidth={style.borderWidth}
      dash={[8, 4]}
      cornerRadius={Math.min(width, height) * 0.25}
      listening={true}
      shadowColor={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.1)"}
      shadowBlur={isSelected ? 8 : 4}
      shadowOpacity={isSelected ? 0.5 : 0.3}
    />
  );
}

/**
 * Render rectangular narration box
 */
function renderRectangleBubble(
  width: number,
  height: number,
  style: any,
  isSelected: boolean
) {
  return (
    <Rect
      width={width}
      height={height}
      fill={style.backgroundColor}
      stroke={style.borderColor}
      strokeWidth={style.borderWidth}
      cornerRadius={4}
      listening={true}
      shadowColor={isSelected ? "#3b82f6" : "rgba(0, 0, 0, 0.1)"}
      shadowBlur={isSelected ? 8 : 4}
      shadowOpacity={isSelected ? 0.5 : 0.3}
    />
  );
}

/**
 * Render text inside bubble
 */
function renderBubbleText(
  bubble: SpeechBubble,
  bubbleTypeDef: BubbleTypeDefinition
) {
  const style = bubbleTypeDef.defaultStyle;
  const { width, height, text } = bubble;

  // Calculate text positioning
  const padding = style.padding;
  const textWidth = width - padding * 2;
  const textHeight = height - padding * 2;

  return (
    <Text
      x={padding}
      y={padding}
      width={textWidth}
      height={textHeight}
      text={text}
      fontSize={style.fontSize}
      fontFamily={style.fontFamily}
      fontStyle={style.fontWeight === "bold" ? "bold" : "normal"}
      fill={style.textColor}
      align={style.textAlign}
      verticalAlign="middle"
      wrap="word"
      listening={false}
    />
  );
}
