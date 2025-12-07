import { useEffect, useRef, useCallback, useState } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import type { Panel, Page, Character } from "@/types";

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  forceSave: () => Promise<void>;
}

type ChangeType = "panel" | "page" | "character";

interface PendingChange {
  type: ChangeType;
  id: string;
  updates: Partial<Panel> | Partial<Page> | Partial<Character>;
}

/**
 * Hook to automatically save editor changes with debouncing
 * Tracks changes to panels, pages, and characters and persists them to the database
 * 
 * @param options Configuration options for auto-save behavior
 * @returns Auto-save state and control functions
 */
export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const {
    enabled = true,
    debounceMs = 2000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Store references
  const updatePanel = useEditorStore((state) => state.updatePanel);
  const updatePage = useEditorStore((state) => state.updatePage);
  const updateCharacter = useEditorStore((state) => state.updateCharacter);
  const panels = useEditorStore((state) => state.panels);
  const pages = useEditorStore((state) => state.pages);
  const characters = useEditorStore((state) => state.characters);

  // Track pending changes
  const pendingChangesRef = useRef<Map<string, PendingChange>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStateRef = useRef<{
    panels: Panel[];
    pages: Page[];
    characters: Character[];
  }>({ panels: [], pages: [], characters: [] });

  /**
   * Execute all pending saves
   */
  const executeSave = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    onSaveStart?.();

    const changesToSave = Array.from(pendingChangesRef.current.values());
    pendingChangesRef.current.clear();

    try {
      // Execute all saves in parallel
      await Promise.all(
        changesToSave.map(async (change) => {
          switch (change.type) {
            case "panel":
              await updatePanel(change.id, change.updates as Partial<Panel>);
              break;
            case "page":
              await updatePage(change.id, change.updates as Partial<Page>);
              break;
            case "character":
              await updateCharacter(change.id, change.updates as Partial<Character>);
              break;
          }
        })
      );

      setLastSaved(new Date());
      onSaveSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
      setSaveError(errorMessage);
      onSaveError?.(error instanceof Error ? error : new Error(errorMessage));
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [updatePanel, updatePage, updateCharacter, onSaveStart, onSaveSuccess, onSaveError]);

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);
  }, [enabled, debounceMs, executeSave]);

  /**
   * Force an immediate save (bypasses debouncing)
   */
  const forceSave = useCallback(async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    await executeSave();
  }, [executeSave]);

  /**
   * Detect changes in panels and queue for save
   */
  useEffect(() => {
    if (!enabled) return;

    const prevPanels = previousStateRef.current.panels;
    
    // Find changed panels by comparing with previous state
    panels.forEach((panel) => {
      const prevPanel = prevPanels.find((p) => p.id === panel.id);
      
      if (!prevPanel) {
        // New panel - no need to auto-save, it was just created
        return;
      }

      // Check if panel has changed
      const hasChanged =
        panel.x !== prevPanel.x ||
        panel.y !== prevPanel.y ||
        panel.width !== prevPanel.width ||
        panel.height !== prevPanel.height ||
        panel.prompt !== prevPanel.prompt ||
        JSON.stringify(panel.bubbles) !== JSON.stringify(prevPanel.bubbles) ||
        JSON.stringify(panel.characterHandles) !== JSON.stringify(prevPanel.characterHandles) ||
        JSON.stringify(panel.styleLocks) !== JSON.stringify(prevPanel.styleLocks);

      if (hasChanged) {
        // Queue this panel for save
        pendingChangesRef.current.set(`panel-${panel.id}`, {
          type: "panel",
          id: panel.id,
          updates: {
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
            prompt: panel.prompt,
            bubbles: panel.bubbles,
            characterHandles: panel.characterHandles,
            styleLocks: panel.styleLocks,
          },
        });
      }
    });

    // Update previous state
    previousStateRef.current.panels = panels;

    // Schedule save if there are pending changes
    if (pendingChangesRef.current.size > 0) {
      scheduleSave();
    }
  }, [panels, enabled, scheduleSave]);

  /**
   * Detect changes in pages and queue for save
   */
  useEffect(() => {
    if (!enabled) return;

    const prevPages = previousStateRef.current.pages;
    
    pages.forEach((page) => {
      const prevPage = prevPages.find((p) => p.id === page.id);
      
      if (!prevPage) {
        // New page - no need to auto-save
        return;
      }

      // Check if page has changed
      const hasChanged =
        page.pageNumber !== prevPage.pageNumber ||
        page.width !== prevPage.width ||
        page.height !== prevPage.height ||
        // @ts-expect-error
        page.thumbnailUrl !== prevPage.thumbnailUrl;

      if (hasChanged) {
        pendingChangesRef.current.set(`page-${page.id}`, {
          type: "page",
          id: page.id,
          updates: {
            pageNumber: page.pageNumber,
            width: page.width,
            height: page.height,
            // @ts-expect-error
            thumbnailUrl: page.thumbnailUrl,
          },
        });
      }
    });

    previousStateRef.current.pages = pages;

    if (pendingChangesRef.current.size > 0) {
      scheduleSave();
    }
  }, [pages, enabled, scheduleSave]);

  /**
   * Detect changes in characters and queue for save
   */
  useEffect(() => {
    if (!enabled) return;

    const prevCharacters = previousStateRef.current.characters;
    
    characters.forEach((character) => {
      const prevCharacter = prevCharacters.find((c) => c.id === character.id);
      
      if (!prevCharacter) {
        // New character - no need to auto-save
        return;
      }

      // Check if character has changed
      const hasChanged =
        character.name !== prevCharacter.name ||
        character.handle !== prevCharacter.handle ||
        character.description !== prevCharacter.description ||
        JSON.stringify(character.referenceImages) !== JSON.stringify(prevCharacter.referenceImages) ||
        JSON.stringify(character.turnaround) !== JSON.stringify(prevCharacter.turnaround) ||
        JSON.stringify(character.expressions) !== JSON.stringify(prevCharacter.expressions) ||
        JSON.stringify(character.promptTriggers) !== JSON.stringify(prevCharacter.promptTriggers);

      if (hasChanged) {
        pendingChangesRef.current.set(`character-${character.id}`, {
          type: "character",
          id: character.id,
          updates: {
            name: character.name,
            handle: character.handle,
            description: character.description,
            referenceImages: character.referenceImages,
            turnaround: character.turnaround,
            expressions: character.expressions,
            promptTriggers: character.promptTriggers,
          },
        });
      }
    });

    previousStateRef.current.characters = characters;

    if (pendingChangesRef.current.size > 0) {
      scheduleSave();
    }
  }, [characters, enabled, scheduleSave]);

  /**
   * Cleanup: save any pending changes on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Force save any pending changes on unmount
      if (pendingChangesRef.current.size > 0) {
        executeSave();
      }
    };
  }, [executeSave]);

  return {
    isSaving,
    lastSaved,
    saveError,
    forceSave,
  };
}
