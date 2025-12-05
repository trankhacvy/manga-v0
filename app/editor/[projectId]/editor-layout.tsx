"use client";

import React, { useState, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { EditorTopBar } from "@/components/editor/editor-top-bar";
import { EditorBottomBar } from "@/components/editor/editor-bottom-bar";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { CharacterLibrary } from "@/components/editor/character-library";
import { LayoutTemplates } from "@/components/editor/layout-templates";
import { BubbleStyles } from "@/components/editor/bubble-styles";
import { PanelInspector } from "@/components/editor/panel-inspector";
import { EditorChatPanel } from "@/components/editor/editor-chat-panel";
import { PageNavigator } from "@/components/editor/page-navigator";
import { toast } from "sonner";
import { useEditorData } from "@/lib/hooks/use-editor-data";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { usePanelDeletion } from "@/lib/hooks/use-panel-deletion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ShortcutsModal } from "@/components/help/shortcuts-modal";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

interface EditorLayoutProps {
  projectId: string;
  children?: React.ReactNode;
  onAddBubbleRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Main editor layout component with 3-column structure:
 * - Left sidebar: AI chat and page navigator
 * - Center: Canvas area
 * - Right sidebar: Character library, layout templates, and panel inspector
 */
export function EditorLayout({
  projectId,
  children,
  onAddBubbleRef,
}: EditorLayoutProps) {
  // Toast notifications using Sonner
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      switch (type) {
        case "success":
          toast.success(message);
          break;
        case "error":
          toast.error(message);
          break;
        case "info":
        default:
          toast.info(message);
          break;
      }
    },
    []
  );

  // Shortcuts modal state
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  // Load project data with automatic retry on failure
  const { isLoading, error, retry, isRetrying, retryCount } = useEditorData({
    projectId,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
  });

  // Enable auto-save for editor changes (only when data is loaded)
  useAutoSave({
    enabled: !isLoading && !error,
    debounceMs: 2000,
    onSaveError: (error) => {
      console.error("Auto-save error:", error);
      toast.error("Failed to save changes");
    },
  });

  // Handle panel deletion with confirmation
  const {
    showConfirmDialog,
    panelsToDelete,
    requestDeleteSelectedPanels,
    confirmDelete,
    cancelDelete,
  } = usePanelDeletion();

  // Handle add bubble action
  const handleAddBubble = () => {
    if (onAddBubbleRef?.current) {
      onAddBubbleRef.current();
    }
  };

  // Enable keyboard shortcuts for editor
  useKeyboardShortcuts({
    onDeleteRequested: requestDeleteSelectedPanels,
    onFocusPrompt: () => {
      const promptInput = document.querySelector(
        '[data-prompt-input="true"]'
      ) as HTMLInputElement;
      if (promptInput) {
        promptInput.focus();
        promptInput.select();
      }
    },
    onShowShortcuts: () => {
      setShowShortcutsModal(true);
    },
    onShowToast: showToast,
  });

  // Show loading state
  if (isLoading && !isRetrying) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !isRetrying) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Failed to load editor
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                Attempted {retryCount} time{retryCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show retrying state
  if (isRetrying) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">
            Retrying... (Attempt {retryCount}/3)
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen w-screen overflow-hidden [--header-height:--spacing(14)] [--footer-height:--spacing(16)]">
      <SidebarProvider>
        {/* Top Bar - z-index 50 */}
        <header className="bg-background fixed top-0 z-50 flex h-(--header-height) w-full items-center border-b">
          <div className="flex h-full w-full items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <EditorTopBar projectId={projectId} />
          </div>
        </header>

        {/* Main Content Area with Sidebars */}
        <div className="w-full flex pt-(--header-height) pb-(--footer-height)">
          {/* Left Sidebar - Chat & Page Navigator */}
          <Sidebar
            side="left"
            collapsible="offcanvas"
            className="top-(--header-height) h-[calc(100svh-var(--header-height)-var(--footer-height))]"
          >
            <SidebarContent className="p-0 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <EditorChatPanel
                  projectId={projectId}
                  onShowToast={showToast}
                />
              </div>
              <div className="h-[300px] border-t">
                <PageNavigator onShowToast={showToast} />
              </div>
            </SidebarContent>
          </Sidebar>

          {/* Center Canvas Area */}
          <SidebarInset className="flex flex-col">
            <main className="flex-1 bg-muted/30 relative overflow-hidden">
              <EditorCanvas onShowToast={showToast}>{children}</EditorCanvas>
              {/* Canvas Controls - positioned in bottom-right */}
              <CanvasControls containerWidth={800} containerHeight={600} />
            </main>
          </SidebarInset>

          {/* Right Sidebar - Libraries & Inspector */}
          <Sidebar
            side="right"
            collapsible="offcanvas"
            className="top-(--header-height) h-[calc(100svh-var(--header-height)-var(--footer-height))]"
          >
            <SidebarContent className="p-0 overflow-y-auto">
              <PanelInspector />
              <CharacterLibrary />
              <LayoutTemplates onShowToast={showToast} />
              <BubbleStyles
                onShowToast={showToast}
                onApplyStyle={(bubbleTypeId) => {
                  // TODO: Implement bubble style application
                  // This will be connected when bubble selection is implemented
                  console.log("Apply bubble style:", bubbleTypeId);
                }}
              />
            </SidebarContent>
          </Sidebar>
        </div>

        {/* Bottom Bar - z-index 50 */}
        <footer className="bg-background fixed bottom-0 z-50 flex h-(--footer-height) w-full items-center border-t">
          <div className="flex h-full w-full items-center">
            <EditorBottomBar
              projectId={projectId}
              onAddBubble={handleAddBubble}
            />
          </div>
        </footer>
      </SidebarProvider>

      {/* Confirmation Dialog for Panel Deletion */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Panels"
        message={`Are you sure you want to delete ${
          panelsToDelete.length
        } panel${
          panelsToDelete.length > 1 ? "s" : ""
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
