"use client";

import React, { useMemo } from "react";
import { Group, Rect, Text, Line } from "react-konva";
import type { Page, Panel } from "@/types";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_STYLES,
  calculatePageYOffset,
} from "@/lib/constants/page-dimensions";
import { getLayoutById } from "@/lib/layout-templates";

interface PageContainerProps {
  page: Page;
  pageNumber: number;
  panels?: Panel[]; // Panels on this page (for grid visibility logic)
  layoutTemplateId?: string; // Optional layout template to show grid for
  showGrid?: boolean; // Force show/hide grid
  onEmptyStateClick?: () => void; // Callback when user clicks "Choose layout" button
  children?: React.ReactNode;
}

/**
 * Page Container Component
 *
 * Renders a manga page on the canvas with:
 * - White background
 * - Border and shadow
 * - Page number label
 * - Layout grid guides (dashed lines)
 * - Contains panels as children
 */
export function PageContainer({
  page,
  pageNumber,
  panels = [],
  layoutTemplateId,
  showGrid = true,
  onEmptyStateClick,
  children,
}: PageContainerProps) {
  // Calculate Y offset based on page number (0-indexed)
  const yOffset = calculatePageYOffset(pageNumber);

  // Use page dimensions or default
  const pageWidth = page.width || DEFAULT_PAGE_SIZE.width;
  const pageHeight = page.height || DEFAULT_PAGE_SIZE.height;

  // Calculate grid opacity based on panel count
  // Keep grid visible but fade slightly as panels are added
  const gridOpacity = useMemo(() => {
    if (!showGrid) return 0;
    if (panels.length === 0) return 0.5; // More visible when empty
    if (panels.length <= 2) return 0.4; // Medium visibility
    if (panels.length <= 4) return 0.35; // Still visible
    return 0.3; // Visible but subtle with many panels
  }, [showGrid, panels.length]);

  // Generate grid lines based on layout template or common grids
  const gridLines = useMemo(() => {
    if (gridOpacity === 0) return [];

    const lines: Array<{ points: number[]; key: string }> = [];

    // Determine grid type based on layoutTemplateId or default to 2x3
    // This creates visual guides for common panel layouts
    const gridType = layoutTemplateId || "2x3";

    // Generate grid lines based on common patterns
    if (gridType.includes("2x2") || gridType.includes("4-panel")) {
      // 2x2 grid: one vertical, one horizontal line
      lines.push({
        key: "v-50",
        points: [pageWidth / 2, 0, pageWidth / 2, pageHeight],
      });
      lines.push({
        key: "h-50",
        points: [0, pageHeight / 2, pageWidth, pageHeight / 2],
      });
    } else if (gridType.includes("2x3") || gridType.includes("6-panel")) {
      // 2x3 grid: one vertical, two horizontal lines (most common)
      lines.push({
        key: "v-50",
        points: [pageWidth / 2, 0, pageWidth / 2, pageHeight],
      });
      lines.push({
        key: "h-33",
        points: [0, pageHeight / 3, pageWidth, pageHeight / 3],
      });
      lines.push({
        key: "h-67",
        points: [0, (pageHeight * 2) / 3, pageWidth, (pageHeight * 2) / 3],
      });
    } else if (gridType.includes("3-panel") || gridType.includes("3x1")) {
      // 3 horizontal panels: two horizontal lines
      lines.push({
        key: "h-33",
        points: [0, pageHeight / 3, pageWidth, pageHeight / 3],
      });
      lines.push({
        key: "h-67",
        points: [0, (pageHeight * 2) / 3, pageWidth, (pageHeight * 2) / 3],
      });
    } else if (gridType.includes("8-panel") || gridType.includes("4x2")) {
      // 4x2 grid: one vertical, three horizontal lines
      lines.push({
        key: "v-50",
        points: [pageWidth / 2, 0, pageWidth / 2, pageHeight],
      });
      lines.push({
        key: "h-25",
        points: [0, pageHeight / 4, pageWidth, pageHeight / 4],
      });
      lines.push({
        key: "h-50",
        points: [0, pageHeight / 2, pageWidth, pageHeight / 2],
      });
      lines.push({
        key: "h-75",
        points: [0, (pageHeight * 3) / 4, pageWidth, (pageHeight * 3) / 4],
      });
    } else if (gridType.includes("1x1") || gridType.includes("splash")) {
      // Single panel: no grid lines needed
      // Empty - full page splash
    } else {
      // Default: 2x3 grid for unknown layouts
      lines.push({
        key: "v-50",
        points: [pageWidth / 2, 0, pageWidth / 2, pageHeight],
      });
      lines.push({
        key: "h-33",
        points: [0, pageHeight / 3, pageWidth, pageHeight / 3],
      });
      lines.push({
        key: "h-67",
        points: [0, (pageHeight * 2) / 3, pageWidth, (pageHeight * 2) / 3],
      });
    }

    return lines;
  }, [pageWidth, pageHeight, gridOpacity, layoutTemplateId]);

  return (
    <Group x={0} y={yOffset}>
      {/* Page shadow (rendered first, behind everything) */}
      <Rect
        x={PAGE_STYLES.shadowOffsetX}
        y={PAGE_STYLES.shadowOffsetY}
        width={pageWidth}
        height={pageHeight}
        fill={PAGE_STYLES.shadowColor}
        shadowBlur={PAGE_STYLES.shadowBlur}
        shadowColor={PAGE_STYLES.shadowColor}
        shadowOffsetX={0}
        shadowOffsetY={2}
      />

      {/* Page background */}
      <Rect
        x={0}
        y={0}
        width={pageWidth}
        height={pageHeight}
        fill={PAGE_STYLES.backgroundColor}
        stroke={PAGE_STYLES.borderColor}
        strokeWidth={PAGE_STYLES.borderWidth}
      />

      {/* Layout grid guides */}
      {gridLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={PAGE_STYLES.gridColor}
          strokeWidth={1.5}
          dash={[...PAGE_STYLES.gridDashPattern]}
          opacity={gridOpacity}
          listening={false} // Don't capture mouse events
        />
      ))}

      {/* Page number label (above page) */}
      <Text
        x={0}
        y={PAGE_STYLES.labelOffsetY}
        width={pageWidth}
        text={`Page ${pageNumber + 1}`}
        fontSize={PAGE_STYLES.labelFontSize}
        fontFamily={PAGE_STYLES.labelFontFamily}
        fill={PAGE_STYLES.labelColor}
        align="center"
      />

      {/* Layout template name (below page number) */}
      {layoutTemplateId &&
        (() => {
          const template = getLayoutById(layoutTemplateId);
          return template ? (
            <Text
              x={0}
              y={PAGE_STYLES.labelOffsetY + 18}
              width={pageWidth}
              text={template.name}
              fontSize={11}
              fontFamily={PAGE_STYLES.labelFontFamily}
              fill="#9ca3af"
              align="center"
            />
          ) : null;
        })()}

      {/* Empty state overlay */}
      {panels.length === 0 && onEmptyStateClick && (
        <EmptyPageState
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          onChooseLayout={onEmptyStateClick}
        />
      )}

      {/* Panels and other content */}
      {children}
    </Group>
  );
}

/**
 * Empty page state component
 * Shows when a page has no panels
 */
function EmptyPageState({
  pageWidth,
  pageHeight,
  onChooseLayout,
}: {
  pageWidth: number;
  pageHeight: number;
  onChooseLayout: () => void;
}) {
  return (
    <Group>
      {/* Semi-transparent overlay */}
      <Rect
        x={0}
        y={0}
        width={pageWidth}
        height={pageHeight}
        fill="rgba(255, 255, 255, 0.3)"
        listening={false}
      />

      {/* Center content - using a Group to position text */}
      <Group x={pageWidth / 2} y={pageHeight / 2}>
        {/* Icon placeholder (grid icon) */}
        <Text
          x={-20}
          y={-80}
          text="⊞"
          fontSize={60}
          fill="#d1d5db"
          align="center"
          listening={false}
        />

        {/* Text */}
        <Text
          x={-100}
          y={20}
          width={200}
          text="Choose a layout to start"
          fontSize={18}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#6b7280"
          align="center"
          listening={false}
        />

        {/* Button (rendered as text, actual click handled by parent) */}
        <Rect
          x={-70}
          y={60}
          width={140}
          height={40}
          fill="#3b82f6"
          cornerRadius={6}
          onClick={onChooseLayout}
          onTap={onChooseLayout}
          listening={true}
          cursor="pointer"
        />
        <Text
          x={-70}
          y={60}
          width={140}
          height={40}
          text="Select Layout"
          fontSize={14}
          fontFamily="Inter, system-ui, sans-serif"
          fill="white"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    </Group>
  );
}
