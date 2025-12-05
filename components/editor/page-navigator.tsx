"use client";

import React, { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { generatePageThumbnail } from "@/lib/utils/thumbnail-generator";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Page } from "@/types";

interface PageNavigatorProps {
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Page Navigator Component
 * Displays vertical list of page thumbnails with navigation and management
 */
export function PageNavigator({ onShowToast }: PageNavigatorProps) {
  const { pages, panels, project, addPage, removePage, updatePage } =
    useEditorStore();
  const { centerOnPage } = useCanvasStore();

  const [currentPageId, setCurrentPageId] = useState<string | null>(
    pages[0]?.id || null
  );
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(
    new Set()
  );
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);

  // Generate thumbnail for a page
  const generateThumbnail = useCallback(
    async (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;

      const pagePanels = panels.filter((p) => p.pageId === pageId);
      if (pagePanels.length === 0) return;

      setLoadingThumbnails((prev) => new Set(prev).add(pageId));

      try {
        const thumbnailUrl = await generatePageThumbnail(page, pagePanels);
        setThumbnails((prev) => new Map(prev).set(pageId, thumbnailUrl));
      } catch (error) {
        console.error("Failed to generate thumbnail:", error);
      } finally {
        setLoadingThumbnails((prev) => {
          const next = new Set(prev);
          next.delete(pageId);
          return next;
        });
      }
    },
    [pages, panels]
  );

  // Navigate to a page
  const handlePageClick = useCallback(
    (pageId: string) => {
      setCurrentPageId(pageId);

      // Get panels for this page and center on them
      const pagePanels = panels.filter((p) => p.pageId === pageId);
      if (pagePanels.length > 0) {
        // Use fitToView to center on the page's panels
        const { fitToView } = useCanvasStore.getState();
        // Get container dimensions (approximate - will be adjusted by canvas component)
        const containerWidth = window.innerWidth * 0.6; // Approximate center area
        const containerHeight = window.innerHeight - 200; // Minus top/bottom bars

        fitToView(pagePanels, containerWidth, containerHeight);
      }

      onShowToast?.("Navigated to page", "info");
    },
    [panels, onShowToast]
  );

  // Add new page
  const handleAddPage = useCallback(async () => {
    if (!project) return;

    setIsAddingPage(true);

    try {
      const supabase = createClient();
      const newPageNumber = pages.length + 1;

      const { data, error } = await supabase
        .from("pages")
        .insert({
          project_id: project.id,
          page_number: newPageNumber,
          width: 1654,
          height: 2339,
          layout_type: "custom",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newPage: Page = {
        id: data.id,
        projectId: data.project_id,
        pageNumber: data.page_number,
        width: data.width,
        height: data.height,
        layoutTemplateId: data.layout_template_id ?? undefined,
        createdAt: new Date(data.created_at!),
        updatedAt: new Date(data.updated_at!),
      };

      addPage(newPage);
      onShowToast?.("Page added successfully", "success");
    } catch (error) {
      console.error("Failed to add page:", error);
      onShowToast?.(
        error instanceof Error ? error.message : "Failed to add page",
        "error"
      );
    } finally {
      setIsAddingPage(false);
    }
  }, [project, pages, addPage, onShowToast]);

  // Delete page with confirmation
  const handleDeletePage = useCallback(
    async (pageId: string, pageNumber: number) => {
      if (pages.length <= 1) {
        onShowToast?.("Cannot delete the last page", "error");
        return;
      }

      const confirmed = window.confirm(
        `Delete page ${pageNumber}? This will also delete all panels on this page.`
      );
      if (!confirmed) return;

      try {
        const supabase = createClient();

        // Delete all panels on this page first
        const pagePanels = panels.filter((p) => p.pageId === pageId);
        if (pagePanels.length > 0) {
          const { error: panelsError } = await supabase
            .from("panels")
            .delete()
            .in(
              "id",
              pagePanels.map((p) => p.id)
            );

          if (panelsError) throw panelsError;
        }

        // Delete the page
        const { error } = await supabase
          .from("pages")
          .delete()
          .eq("id", pageId);

        if (error) throw error;

        removePage(pageId);

        // Update page numbers for remaining pages
        const remainingPages = pages
          .filter((p) => p.id !== pageId)
          .sort((a, b) => a.pageNumber - b.pageNumber);

        for (let i = 0; i < remainingPages.length; i++) {
          if (remainingPages[i].pageNumber !== i + 1) {
            await updatePage(remainingPages[i].id, { pageNumber: i + 1 });
          }
        }

        // Clear thumbnail cache for deleted page
        setThumbnails((prev) => {
          const next = new Map(prev);
          next.delete(pageId);
          return next;
        });

        // Navigate to first page if current page was deleted
        if (currentPageId === pageId && remainingPages.length > 0) {
          handlePageClick(remainingPages[0].id);
        }

        onShowToast?.("Page deleted successfully", "success");
      } catch (error) {
        console.error("Failed to delete page:", error);
        onShowToast?.(
          error instanceof Error ? error.message : "Failed to delete page",
          "error"
        );
      }
    },
    [
      pages,
      panels,
      currentPageId,
      removePage,
      updatePage,
      handlePageClick,
      onShowToast,
    ]
  );

  // Drag and drop handlers for reordering
  const handleDragStart = useCallback((pageId: string) => {
    setDraggedPageId(pageId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (targetPageId: string) => {
      if (!draggedPageId || draggedPageId === targetPageId) {
        setDraggedPageId(null);
        return;
      }

      const draggedPage = pages.find((p) => p.id === draggedPageId);
      const targetPage = pages.find((p) => p.id === targetPageId);

      if (!draggedPage || !targetPage) {
        setDraggedPageId(null);
        return;
      }

      try {
        // Swap page numbers
        const tempPageNumber = draggedPage.pageNumber;
        await updatePage(draggedPage.id, { pageNumber: targetPage.pageNumber });
        await updatePage(targetPage.id, { pageNumber: tempPageNumber });

        onShowToast?.("Pages reordered successfully", "success");
      } catch (error) {
        console.error("Failed to reorder pages:", error);
        onShowToast?.(
          error instanceof Error ? error.message : "Failed to reorder pages",
          "error"
        );
      } finally {
        setDraggedPageId(null);
      }
    },
    [draggedPageId, pages, updatePage, onShowToast]
  );

  // Sort pages by page number
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <div className="flex flex-col h-full bg-background border-t">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold">Pages</h3>
        <button
          onClick={handleAddPage}
          disabled={isAddingPage}
          className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          title="Add Page"
        >
          {isAddingPage ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Page List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground mb-2">No pages yet</p>
            <button
              onClick={handleAddPage}
              className="text-xs text-primary hover:underline"
            >
              Add your first page
            </button>
          </div>
        ) : (
          sortedPages.map((page) => {
            const pagePanels = panels.filter((p) => p.pageId === page.id);
            const isLoading = loadingThumbnails.has(page.id);
            const isCurrent = currentPageId === page.id;
            const isDragging = draggedPageId === page.id;
            const thumbnailUrl = thumbnails.get(page.id);

            return (
              <div
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(page.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(page.id)}
                className={`
                  group relative rounded-lg border-2 transition-all cursor-pointer
                  ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }
                  ${isDragging ? "opacity-50" : "opacity-100"}
                `}
                onClick={() => handlePageClick(page.id)}
              >
                {/* Drag Handle */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Thumbnail */}
                <div className="aspect-1654/2339 bg-muted rounded-md overflow-hidden relative">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : pagePanels.length > 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateThumbnail(page.id);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Generate
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Empty</p>
                    </div>
                  )}

                  {/* Page Number Badge */}
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
                    <span className="text-xs font-medium">
                      {page.pageNumber}
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePage(page.id, page.pageNumber);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 bg-destructive/90 backdrop-blur-sm text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  title="Delete Page"
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {/* Panel Count */}
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
                  <span className="text-xs text-muted-foreground">
                    {pagePanels.length} panel
                    {pagePanels.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
