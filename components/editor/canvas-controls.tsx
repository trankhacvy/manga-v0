"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useEditorStore } from "@/lib/store/editor-store";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SPACING,
  calculatePageYOffset,
} from "@/lib/constants/page-dimensions";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CanvasControlsProps {
  containerWidth?: number;
  containerHeight?: number;
}

/**
 * Canvas zoom controls component
 * Positioned at center bottom of canvas area (draggable)
 * Provides zoom in/out, fit to view, and reset zoom functionality
 */
export function CanvasControls({
  containerWidth,
  containerHeight,
}: CanvasControlsProps) {
  const { zoom, zoomIn, zoomOut, resetZoom, fitToView } = useCanvasStore();
  const { pages, panels } = useEditorStore();

  // Get actual container dimensions from window if not provided
  const actualWidth = containerWidth ?? window.innerWidth;
  const actualHeight = containerHeight ?? window.innerHeight;

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const controlsRef = useRef<HTMLDivElement>(null);

  // Initialize position to center bottom
  useEffect(() => {
    if (controlsRef.current && position.x === 0 && position.y === 0) {
      const rect = controlsRef.current.getBoundingClientRect();
      const centerX = (window.innerWidth - rect.width) / 2;
      // Position at bottom with some padding (96px from bottom for bottom bar)
      const bottomY = window.innerHeight - rect.height - 96;
      setPosition({ x: centerX, y: bottomY });
    }
  }, [position.x, position.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return; // Don't start drag if clicking a button
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep within viewport bounds
      if (controlsRef.current) {
        const rect = controlsRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleFitToView = () => {
    // If we have pages, fit to all pages; otherwise fit to panels
    if (pages.length > 0) {
      // Calculate bounds for all pages including their Y offsets
      const pageBounds = pages.map((page, index) => {
        const yOffset = calculatePageYOffset(index);
        return {
          x: 0,
          y: yOffset,
          width: page.width || DEFAULT_PAGE_SIZE.width,
          height: page.height || DEFAULT_PAGE_SIZE.height,
        };
      });
      fitToView(pageBounds, actualWidth, actualHeight);
    } else if (panels.length > 0) {
      // Fallback to panels if no pages
      const panelBounds = panels.map((p) => ({
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      }));
      fitToView(panelBounds, actualWidth, actualHeight);
    }
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <TooltipProvider>
      <div
        ref={controlsRef}
        className="fixed z-40 flex items-center gap-2 bg-background border rounded-lg shadow-lg p-2 cursor-move select-none"
        style={{
          left: position.x > 0 ? `${position.x}px` : "50%",
          top: position.y > 0 ? `${position.y}px` : "auto",
          bottom: position.y === 0 ? "96px" : "auto",
          transform: position.x === 0 ? "translateX(-50%)" : "none",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Drag Handle */}
        <div className="flex items-center text-muted-foreground px-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="size-4" />
        </div>

        <div className="h-6 w-px bg-border" />
        {/* Zoom Out */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={zoomOut}
              disabled={zoom <= 0.1}
              aria-label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>

        {/* Zoom Percentage Display */}
        <div className="flex items-center justify-center px-3 py-1 text-sm font-medium text-foreground min-w-[60px]">
          {zoomPercentage}%
        </div>

        {/* Zoom In */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={zoomIn}
              disabled={zoom >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Fit to View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleFitToView}
              disabled={panels.length === 0}
              aria-label="Fit to view"
            >
              <Maximize2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Fit to View</p>
          </TooltipContent>
        </Tooltip>

        {/* Reset Zoom (100%) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={resetZoom}
              disabled={zoom === 1}
              aria-label="Reset zoom to 100%"
            >
              <RotateCcw className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset Zoom (100%)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
