/**
 * History store for undo/redo functionality
 * Tracks panel and bubble operations with a stack-based history (max 50 actions)
 * 
 * Action types:
 * - move: Panel position change
 * - resize: Panel size change
 * - delete: Panel deletion
 * - create: Panel creation
 * - edit: Panel property edit (prompt, characters, etc.)
 * - bubbleEdit: Bubble text edit
 * - bubbleMove: Bubble position change
 * - bubbleResize: Bubble size change
 * - bubbleDelete: Bubble deletion
 * - bubbleCreate: Bubble creation
 */

import { create } from "zustand";
import type { Panel, SpeechBubble } from "@/types";
import { useEditorStore } from "./editor-store";
import { createClient } from "@/utils/supabase/client";

// Maximum number of actions to keep in history
const MAX_HISTORY_SIZE = 50;

type ActionType =
  | "move"
  | "resize"
  | "delete"
  | "create"
  | "edit"
  | "bubbleEdit"
  | "bubbleMove"
  | "bubbleResize"
  | "bubbleDelete"
  | "bubbleCreate";

interface HistoryAction {
  type: ActionType;
  timestamp: number;
  
  // Panel-related data
  panelId?: string;
  beforePanel?: Panel;
  afterPanel?: Panel;
  
  // Bubble-related data
  bubbleId?: string;
  beforeBubble?: SpeechBubble;
  afterBubble?: SpeechBubble;
  
  // For multi-panel operations
  panelIds?: string[];
  beforePanels?: Panel[];
  afterPanels?: Panel[];
}

interface HistoryState {
  // History stacks
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  
  // Actions - Recording
  recordPanelMove: (panelId: string, before: Panel, after: Panel) => void;
  recordPanelResize: (panelId: string, before: Panel, after: Panel) => void;
  recordPanelDelete: (panels: Panel[]) => void;
  recordPanelCreate: (panel: Panel) => void;
  recordPanelEdit: (panelId: string, before: Panel, after: Panel) => void;
  
  recordBubbleEdit: (panelId: string, bubbleId: string, before: SpeechBubble, after: SpeechBubble) => void;
  recordBubbleMove: (panelId: string, bubbleId: string, before: SpeechBubble, after: SpeechBubble) => void;
  recordBubbleResize: (panelId: string, bubbleId: string, before: SpeechBubble, after: SpeechBubble) => void;
  recordBubbleDelete: (panelId: string, bubble: SpeechBubble) => void;
  recordBubbleCreate: (panelId: string, bubble: SpeechBubble) => void;
  
  // Actions - Undo/Redo
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  
  // Utility
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  
  // Internal
  addToUndoStack: (action: HistoryAction) => void;
  clearRedoStack: () => void;
}

/**
 * Deep clone a panel to avoid reference issues
 */
function clonePanel(panel: Panel): Panel {
  return {
    ...panel,
    bubbles: panel.bubbles ? panel.bubbles.map(b => ({ ...b })) : [],
    characterRefs: panel.characterRefs ? [...panel.characterRefs] : [],
    characterHandles: panel.characterHandles ? [...panel.characterHandles] : [],
    styleLocks: panel.styleLocks ? [...panel.styleLocks] : [],
    generationParams: panel.generationParams ? { ...panel.generationParams } : undefined,
  };
}

/**
 * Deep clone a bubble
 */
function cloneBubble(bubble: SpeechBubble): SpeechBubble {
  return { ...bubble };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  /**
   * Record a panel move operation
   */
  recordPanelMove: (panelId: string, before: Panel, after: Panel) => {
    const action: HistoryAction = {
      type: "move",
      timestamp: Date.now(),
      panelId,
      beforePanel: clonePanel(before),
      afterPanel: clonePanel(after),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record a panel resize operation
   */
  recordPanelResize: (panelId: string, before: Panel, after: Panel) => {
    const action: HistoryAction = {
      type: "resize",
      timestamp: Date.now(),
      panelId,
      beforePanel: clonePanel(before),
      afterPanel: clonePanel(after),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record panel deletion (supports multi-delete)
   */
  recordPanelDelete: (panels: Panel[]) => {
    const action: HistoryAction = {
      type: "delete",
      timestamp: Date.now(),
      panelIds: panels.map(p => p.id),
      beforePanels: panels.map(clonePanel),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record panel creation
   */
  recordPanelCreate: (panel: Panel) => {
    const action: HistoryAction = {
      type: "create",
      timestamp: Date.now(),
      panelId: panel.id,
      afterPanel: clonePanel(panel),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record panel edit (prompt, characters, style locks, etc.)
   */
  recordPanelEdit: (panelId: string, before: Panel, after: Panel) => {
    const action: HistoryAction = {
      type: "edit",
      timestamp: Date.now(),
      panelId,
      beforePanel: clonePanel(before),
      afterPanel: clonePanel(after),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record bubble text edit
   */
  recordBubbleEdit: (panelId: string, bubbleId: string, before: SpeechBubble, after: SpeechBubble) => {
    const action: HistoryAction = {
      type: "bubbleEdit",
      timestamp: Date.now(),
      panelId,
      bubbleId,
      beforeBubble: cloneBubble(before),
      afterBubble: cloneBubble(after),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record bubble move
   */
  recordBubbleMove: (panelId: string, bubbleId: string, before: SpeechBubble, after: SpeechBubble) => {
    const action: HistoryAction = {
      type: "bubbleMove",
      timestamp: Date.now(),
      panelId,
      bubbleId,
      beforeBubble: cloneBubble(before),
      afterBubble: cloneBubble(after),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record bubble resize
   */
  recordBubbleResize: (panelId: string, bubbleId: string, before: SpeechBubble, after: SpeechBubble) => {
    const action: HistoryAction = {
      type: "bubbleResize",
      timestamp: Date.now(),
      panelId,
      bubbleId,
      beforeBubble: cloneBubble(before),
      afterBubble: cloneBubble(after),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record bubble deletion
   */
  recordBubbleDelete: (panelId: string, bubble: SpeechBubble) => {
    const action: HistoryAction = {
      type: "bubbleDelete",
      timestamp: Date.now(),
      panelId,
      bubbleId: bubble.id,
      beforeBubble: cloneBubble(bubble),
    };
    get().addToUndoStack(action);
  },

  /**
   * Record bubble creation
   */
  recordBubbleCreate: (panelId: string, bubble: SpeechBubble) => {
    const action: HistoryAction = {
      type: "bubbleCreate",
      timestamp: Date.now(),
      panelId,
      bubbleId: bubble.id,
      afterBubble: cloneBubble(bubble),
    };
    get().addToUndoStack(action);
  },

  /**
   * Undo the last action
   */
  undo: async () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) {
      console.warn("Nothing to undo");
      return;
    }

    const action = undoStack[undoStack.length - 1];
    const editorStore = useEditorStore.getState();
    const supabase = createClient();

    try {
      switch (action.type) {
        case "move":
        case "resize":
        case "edit":
          // Revert panel to before state
          if (action.beforePanel && action.panelId) {
            await editorStore.updatePanel(action.panelId, {
              x: action.beforePanel.x,
              y: action.beforePanel.y,
              width: action.beforePanel.width,
              height: action.beforePanel.height,
              prompt: action.beforePanel.prompt,
              characterHandles: action.beforePanel.characterHandles,
              styleLocks: action.beforePanel.styleLocks,
              bubbles: action.beforePanel.bubbles,
            });
          }
          break;

        case "delete":
          // Restore deleted panels
          if (action.beforePanels) {
            for (const panel of action.beforePanels) {
              const { error } = await supabase.from("panels").insert({
                id: panel.id,
                page_id: panel.pageId,
                panel_index: panel.panelIndex,
                x: panel.x,
                y: panel.y,
                width: panel.width,
                height: panel.height,
                image_url: panel.imageUrl || "",
                prompt: panel.prompt || "",
                character_refs: panel.characterRefs || [],
                character_handles: panel.characterHandles || [],
                style_locks: panel.styleLocks || [],
                bubbles: panel.bubbles || [],
                sketch_url: panel.sketchUrl,
                controlnet_strength: panel.controlNetStrength,
                generation_params: panel.generationParams,
                created_at: panel.createdAt.toISOString(),
                updated_at: panel.updatedAt.toISOString(),
              });

              if (error) throw error;
              editorStore.addPanel(panel);
            }
          }
          break;

        case "create":
          // Delete created panel
          if (action.panelId) {
            await editorStore.deletePanels([action.panelId]);
          }
          break;

        case "bubbleEdit":
        case "bubbleMove":
        case "bubbleResize":
          // Revert bubble to before state
          if (action.beforeBubble && action.panelId && action.bubbleId) {
            const panel = editorStore.getPanelById(action.panelId);
            if (panel) {
              const updatedBubbles = panel.bubbles.map(b =>
                b.id === action.bubbleId ? action.beforeBubble! : b
              );
              await editorStore.updatePanel(action.panelId, {
                bubbles: updatedBubbles,
              });
            }
          }
          break;

        case "bubbleDelete":
          // Restore deleted bubble
          if (action.beforeBubble && action.panelId) {
            const panel = editorStore.getPanelById(action.panelId);
            if (panel) {
              const updatedBubbles = [...panel.bubbles, action.beforeBubble];
              await editorStore.updatePanel(action.panelId, {
                bubbles: updatedBubbles,
              });
            }
          }
          break;

        case "bubbleCreate":
          // Delete created bubble
          if (action.bubbleId && action.panelId) {
            const panel = editorStore.getPanelById(action.panelId);
            if (panel) {
              const updatedBubbles = panel.bubbles.filter(b => b.id !== action.bubbleId);
              await editorStore.updatePanel(action.panelId, {
                bubbles: updatedBubbles,
              });
            }
          }
          break;
      }

      // Move action from undo to redo stack
      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, action],
      });

      console.log(`Undone action: ${action.type}`);
    } catch (error) {
      console.error("Failed to undo action:", error);
      throw error;
    }
  },

  /**
   * Redo the last undone action
   */
  redo: async () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) {
      console.warn("Nothing to redo");
      return;
    }

    const action = redoStack[redoStack.length - 1];
    const editorStore = useEditorStore.getState();
    const supabase = createClient();

    try {
      switch (action.type) {
        case "move":
        case "resize":
        case "edit":
          // Reapply panel to after state
          if (action.afterPanel && action.panelId) {
            await editorStore.updatePanel(action.panelId, {
              x: action.afterPanel.x,
              y: action.afterPanel.y,
              width: action.afterPanel.width,
              height: action.afterPanel.height,
              prompt: action.afterPanel.prompt,
              characterHandles: action.afterPanel.characterHandles,
              styleLocks: action.afterPanel.styleLocks,
              bubbles: action.afterPanel.bubbles,
            });
          }
          break;

        case "delete":
          // Re-delete panels
          if (action.panelIds) {
            await editorStore.deletePanels(action.panelIds);
          }
          break;

        case "create":
          // Re-create panel
          if (action.afterPanel) {
            const { error } = await supabase.from("panels").insert({
              id: action.afterPanel.id,
              page_id: action.afterPanel.pageId,
              panel_index: action.afterPanel.panelIndex,
              x: action.afterPanel.x,
              y: action.afterPanel.y,
              width: action.afterPanel.width,
              height: action.afterPanel.height,
              image_url: action.afterPanel.imageUrl || "",
              prompt: action.afterPanel.prompt || "",
              character_refs: action.afterPanel.characterRefs || [],
              character_handles: action.afterPanel.characterHandles || [],
              style_locks: action.afterPanel.styleLocks || [],
              bubbles: action.afterPanel.bubbles || [],
              sketch_url: action.afterPanel.sketchUrl,
              controlnet_strength: action.afterPanel.controlNetStrength,
              generation_params: action.afterPanel.generationParams,
              created_at: action.afterPanel.createdAt.toISOString(),
              updated_at: action.afterPanel.updatedAt.toISOString(),
            });

            if (error) throw error;
            editorStore.addPanel(action.afterPanel);
          }
          break;

        case "bubbleEdit":
        case "bubbleMove":
        case "bubbleResize":
          // Reapply bubble to after state
          if (action.afterBubble && action.panelId && action.bubbleId) {
            const panel = editorStore.getPanelById(action.panelId);
            if (panel) {
              const updatedBubbles = panel.bubbles.map(b =>
                b.id === action.bubbleId ? action.afterBubble! : b
              );
              await editorStore.updatePanel(action.panelId, {
                bubbles: updatedBubbles,
              });
            }
          }
          break;

        case "bubbleDelete":
          // Re-delete bubble
          if (action.bubbleId && action.panelId) {
            const panel = editorStore.getPanelById(action.panelId);
            if (panel) {
              const updatedBubbles = panel.bubbles.filter(b => b.id !== action.bubbleId);
              await editorStore.updatePanel(action.panelId, {
                bubbles: updatedBubbles,
              });
            }
          }
          break;

        case "bubbleCreate":
          // Re-create bubble
          if (action.afterBubble && action.panelId) {
            const panel = editorStore.getPanelById(action.panelId);
            if (panel) {
              const updatedBubbles = [...panel.bubbles, action.afterBubble];
              await editorStore.updatePanel(action.panelId, {
                bubbles: updatedBubbles,
              });
            }
          }
          break;
      }

      // Move action from redo to undo stack
      set({
        undoStack: [...undoStack, action],
        redoStack: redoStack.slice(0, -1),
      });

      console.log(`Redone action: ${action.type}`);
    } catch (error) {
      console.error("Failed to redo action:", error);
      throw error;
    }
  },

  /**
   * Check if undo is available
   */
  canUndo: () => {
    return get().undoStack.length > 0;
  },

  /**
   * Check if redo is available
   */
  canRedo: () => {
    return get().redoStack.length > 0;
  },

  /**
   * Clear all history
   */
  clear: () => {
    set({ undoStack: [], redoStack: [] });
  },

  /**
   * Add action to undo stack and clear redo stack
   * Limits stack size to MAX_HISTORY_SIZE
   */
  addToUndoStack: (action: HistoryAction) => {
    const { undoStack } = get();
    const newStack = [...undoStack, action];
    
    // Limit stack size
    if (newStack.length > MAX_HISTORY_SIZE) {
      newStack.shift(); // Remove oldest action
    }
    
    set({
      undoStack: newStack,
      redoStack: [], // Clear redo stack when new action is performed
    });
  },

  /**
   * Clear redo stack (called when new action is performed)
   */
  clearRedoStack: () => {
    set({ redoStack: [] });
  },
}));
