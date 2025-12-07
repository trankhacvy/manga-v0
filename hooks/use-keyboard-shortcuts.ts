import { useEffect } from "react";
import { useCanvasStore } from "@/lib/store/canvas-store";

export function useKeyboardShortcuts(onShowShortcuts?: () => void) {
  // @ts-expect-error
  const selectedPanelIds = useCanvasStore((state) => state.selectedPanelIds);
  // @ts-expect-error
  const selectPanel = useCanvasStore((state) => state.selectPanel);
  // @ts-expect-error
  const deletePanel = useCanvasStore((state) => state.deletePanel);
  // @ts-expect-error
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  // @ts-expect-error
  const panels = useCanvasStore((state) => state.panels);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K - Focus global prompt bar
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const promptInput = document.querySelector(
          '[data-prompt-input="true"]'
        ) as HTMLInputElement;
        if (promptInput) {
          promptInput.focus();
          promptInput.select();
        }
      }

      // Delete or Backspace - Delete selected panels
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedPanelIds.length > 0 &&
        !isInputFocused()
      ) {
        e.preventDefault();
        // Delete all selected panels
        // @ts-expect-error
        selectedPanelIds.forEach((panelId) => {
          deletePanel(panelId);
        });
      }

      // Arrow keys - Navigate between panels
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        !isInputFocused()
      ) {
        e.preventDefault();
        navigatePanels(e.key);
      }

      // Escape - Deselect all
      if (e.key === "Escape") {
        clearSelection();
        // Also blur any focused input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }

      // Cmd+A or Ctrl+A - Select all panels
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && !isInputFocused()) {
        e.preventDefault();
        // @ts-expect-error
        const allPanelIds = panels.map((p) => p.id);
        // @ts-expect-error
        useCanvasStore.getState().selectPanels(allPanelIds);
      }

      // ? - Show keyboard shortcuts
      if (e.key === "?" && !isInputFocused()) {
        e.preventDefault();
        if (onShowShortcuts) {
          onShowShortcuts();
        }
      }
    };

    const isInputFocused = () => {
      const activeElement = document.activeElement;
      return (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true"
      );
    };

    const navigatePanels = (key: string) => {
      if (panels.length === 0) return;

      // Get the last selected panel for navigation
      const currentPanelId =
        selectedPanelIds.length > 0
          ? selectedPanelIds[selectedPanelIds.length - 1]
          : null;

      const currentIndex = currentPanelId
      // @ts-expect-error
        ? panels.findIndex((p) => p.id === currentPanelId)
        : -1;

      let nextIndex = currentIndex;

      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (currentIndex + 1) % panels.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = currentIndex <= 0 ? panels.length - 1 : currentIndex - 1;
          break;
      }

      if (nextIndex >= 0 && nextIndex < panels.length) {
        selectPanel(panels[nextIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedPanelIds,
    selectPanel,
    deletePanel,
    clearSelection,
    panels,
    onShowShortcuts,
  ]);
}
