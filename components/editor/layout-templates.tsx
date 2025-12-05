"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layout } from "lucide-react";
import { useEditorStore } from "@/lib/store/editor-store";
import { LAYOUT_TEMPLATES } from "@/lib/layout-templates";
import type { LayoutTemplate } from "@/types/layouts";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface LayoutTemplatesProps {
  className?: string;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Layout Templates Selector Component
 *
 * Displays a grid of predefined layout templates that users can apply to pages.
 * Shows template previews, names, and panel counts.
 */
export function LayoutTemplates({
  className = "",
  onShowToast,
}: LayoutTemplatesProps) {
  const { pages, panels, selectedPanelIds, applyLayoutTemplate } =
    useEditorStore();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [isApplying, setIsApplying] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<LayoutTemplate | null>(
    null
  );
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Get current page (for now, use first page or page with selected panels)
  const currentPage = React.useMemo(() => {
    if (selectedPanelIds.length > 0) {
      const selectedPanel = panels.find((p) => p.id === selectedPanelIds[0]);
      if (selectedPanel) {
        return pages.find((page) => page.id === selectedPanel.pageId);
      }
    }
    return pages[0]; // Default to first page
  }, [pages, panels, selectedPanelIds]);

  // Get panels for current page
  const currentPagePanels = React.useMemo(() => {
    if (!currentPage) return [];
    return panels.filter((p) => p.pageId === currentPage.id);
  }, [currentPage, panels]);

  const handleApplyClick = (template: LayoutTemplate) => {
    if (!currentPage) {
      onShowToast?.("No page selected", "error");
      return;
    }

    // Check if page already has panels
    if (currentPagePanels.length > 0) {
      setTemplateToApply(template);
      setShowAlertDialog(true);
      setOpenPopoverId(null); // Close popover
      return;
    }

    // Apply template directly if no panels exist
    applyTemplate(template);
  };

  const applyTemplate = async (template: LayoutTemplate) => {
    if (!currentPage) return;

    setIsApplying(true);
    setSelectedTemplateId(template.id);
    setOpenPopoverId(null); // Close popover

    try {
      await applyLayoutTemplate(currentPage.id, template);
      onShowToast?.(
        `Applied "${template.name}" layout with ${template.panelCount} panels`,
        "success"
      );
    } catch (error) {
      console.error("Failed to apply layout template:", error);
      onShowToast?.(
        error instanceof Error
          ? error.message
          : "Failed to apply layout template",
        "error"
      );
    } finally {
      setIsApplying(false);
      setSelectedTemplateId(null);
    }
  };

  const handleConfirmApply = async () => {
    setShowAlertDialog(false);
    if (templateToApply) {
      await applyTemplate(templateToApply);
      setTemplateToApply(null);
    }
  };

  const handleCancelApply = () => {
    setShowAlertDialog(false);
    setTemplateToApply(null);
  };

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`flex flex-col border-b border-gray-200 dark:border-gray-700 ${className}`}
      >
        {/* Header with Collapse Toggle */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Layout Templates
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {currentPage
                ? `Page ${currentPage.pageNumber} • ${
                    currentPagePanels.length
                  } panel${currentPagePanels.length !== 1 ? "s" : ""}`
                : "No page selected"}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              {isOpen ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              <span className="sr-only">Toggle layout templates</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Templates Grid */}
        <CollapsibleContent>
          <div className="p-4">
            {!currentPage ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <svg
                  className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No page available
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {LAYOUT_TEMPLATES.map((template) => {
                  const isSelected =
                    currentPage.layoutTemplateId === template.id;
                  const isCurrentlyApplying =
                    isApplying && selectedTemplateId === template.id;

                  return (
                    <Popover
                      key={template.id}
                      open={openPopoverId === template.id}
                      onOpenChange={(open) =>
                        setOpenPopoverId(open ? template.id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button
                          disabled={isCurrentlyApplying}
                          className={`
                            relative group cursor-pointer rounded-lg overflow-hidden
                            border-2 transition-all duration-200
                            ${
                              isSelected
                                ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }
                            ${
                              isCurrentlyApplying
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                            hover:shadow-md
                          `}
                        >
                          {/* Template Preview */}
                          <div className="aspect-square bg-gray-100 dark:bg-gray-900 p-2">
                            <TemplatePreview template={template} />
                          </div>

                          {/* Template Name Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                            <p className="text-xs font-medium text-white truncate">
                              {template.name}
                            </p>
                            <p className="text-xs text-gray-300">
                              {template.panelCount} panels
                            </p>
                          </div>

                          {/* Selected Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}

                          {/* Loading Indicator */}
                          {isCurrentlyApplying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Spinner className="h-6 w-6 text-white" />
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      </PopoverTrigger>

                      {/* Template Details Popover */}
                      <PopoverContent
                        className="w-80"
                        side="left"
                        align="start"
                      >
                        <div className="space-y-4">
                          {/* Header */}
                          <div>
                            <h4 className="font-semibold text-base leading-none mb-1">
                              {template.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {template.gridType} • {template.panelCount} panels
                            </p>
                          </div>

                          {/* Description */}
                          <div>
                            <p className="text-sm">{template.description}</p>
                          </div>

                          {/* Preview */}
                          <div>
                            <h5 className="text-xs font-semibold mb-2">
                              Layout Preview
                            </h5>
                            <div className="w-full aspect-5/7 bg-gray-100 dark:bg-gray-900 rounded border p-4">
                              <TemplatePreview template={template} />
                            </div>
                          </div>

                          {/* Best For */}
                          {template.bestFor.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold mb-2">
                                Best For
                              </h5>
                              <ul className="space-y-1">
                                {template.bestFor.map((use, index) => (
                                  <li
                                    key={index}
                                    className="text-xs text-muted-foreground flex items-start gap-2"
                                  >
                                    <span className="text-primary mt-0.5">
                                      •
                                    </span>
                                    <span>{use}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Tags */}
                          {template.tags.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold mb-2">
                                Tags
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Apply Button */}
                          <div className="pt-2 border-t">
                            <Button
                              onClick={() => handleApplyClick(template)}
                              disabled={isCurrentlyApplying}
                              className="w-full"
                              size="sm"
                            >
                              {isCurrentlyApplying ? (
                                <>
                                  <Spinner className="h-4 w-4 mr-2" />
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <Layout className="h-4 w-4 mr-2" />
                                  Apply Layout
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Layout Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This page already has {currentPagePanels.length} panel
              {currentPagePanels.length !== 1 ? "s" : ""}. Applying "
              {templateToApply?.name}" will add {templateToApply?.panelCount}{" "}
              new panels to the page. You can delete or rearrange panels after
              applying the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelApply}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApply}>
              Apply Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Simple visual preview of the layout template
 * Renders panel rectangles based on template positions
 */
function TemplatePreview({ template }: { template: LayoutTemplate }) {
  return (
    <svg
      viewBox="0 0 100 140"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect
        x="0"
        y="0"
        width="100"
        height="140"
        fill="currentColor"
        className="text-muted"
      />

      {/* Panels */}
      {template.panels.map((panel) => {
        const x = panel.x * 100;
        const y = panel.y * 140;
        const width = panel.width * 100;
        const height = panel.height * 140;

        // Apply margins (scaled down)
        const marginScale = 0.1; // Scale margins for preview
        const mx = panel.margins.left * marginScale;
        const my = panel.margins.top * marginScale;
        const mw = (panel.margins.left + panel.margins.right) * marginScale;
        const mh = (panel.margins.top + panel.margins.bottom) * marginScale;

        return (
          <rect
            key={panel.id}
            x={x + mx}
            y={y + my}
            width={Math.max(0, width - mw)}
            height={Math.max(0, height - mh)}
            fill="currentColor"
            className="text-gray-400 dark:text-gray-600"
            stroke="currentColor"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
