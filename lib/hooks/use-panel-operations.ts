/**
 * Hook that wraps panel operations with history tracking
 * Provides methods for common panel operations that automatically record history
 */

import { useEditorStore } from "@/lib/store/editor-store";
import { useHistoryStore } from "@/lib/store/history-store";
import type { Panel, SpeechBubble } from "@/types";

export function usePanelOperations() {
  const { updatePanel, deletePanels, getPanelById } = useEditorStore();
  const {
    recordPanelMove,
    recordPanelResize,
    recordPanelDelete,
    recordPanelEdit,
    recordBubbleEdit,
    recordBubbleMove,
    recordBubbleResize,
    recordBubbleDelete,
    recordBubbleCreate,
  } = useHistoryStore();

  /**
   * Move a panel with history tracking
   */
  const movePanel = async (panelId: string, newX: number, newY: number) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const beforePanel = { ...panel };
    const afterPanel = { ...panel, x: newX, y: newY };

    recordPanelMove(panelId, beforePanel, afterPanel);
    await updatePanel(panelId, { x: newX, y: newY });
  };

  /**
   * Resize a panel with history tracking
   */
  const resizePanel = async (
    panelId: string,
    newWidth: number,
    newHeight: number,
    newX?: number,
    newY?: number
  ) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const beforePanel = { ...panel };
    const afterPanel = {
      ...panel,
      width: newWidth,
      height: newHeight,
      x: newX ?? panel.x,
      y: newY ?? panel.y,
    };

    recordPanelResize(panelId, beforePanel, afterPanel);
    await updatePanel(panelId, {
      width: newWidth,
      height: newHeight,
      ...(newX !== undefined && { x: newX }),
      ...(newY !== undefined && { y: newY }),
    });
  };

  /**
   * Delete panels with history tracking
   */
  const deletePanelsWithHistory = async (panelIds: string[]) => {
    const panels = panelIds
      .map((id) => getPanelById(id))
      .filter((p): p is Panel => p !== null);

    if (panels.length === 0) return;

    recordPanelDelete(panels);
    await deletePanels(panelIds);
  };

  /**
   * Edit panel properties with history tracking
   */
  const editPanel = async (
    panelId: string,
    updates: Partial<Panel>
  ) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const beforePanel = { ...panel };
    const afterPanel = { ...panel, ...updates };

    recordPanelEdit(panelId, beforePanel, afterPanel);
    await updatePanel(panelId, updates);
  };

  /**
   * Edit bubble text with history tracking
   */
  const editBubbleText = async (
    panelId: string,
    bubbleId: string,
    newText: string
  ) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const bubble = panel.bubbles.find((b) => b.id === bubbleId);
    if (!bubble) return;

    const beforeBubble = { ...bubble };
    const afterBubble = { ...bubble, text: newText };

    recordBubbleEdit(panelId, bubbleId, beforeBubble, afterBubble);

    const updatedBubbles = panel.bubbles.map((b) =>
      b.id === bubbleId ? afterBubble : b
    );
    await updatePanel(panelId, { bubbles: updatedBubbles });
  };

  /**
   * Move bubble with history tracking
   */
  const moveBubble = async (
    panelId: string,
    bubbleId: string,
    newX: number,
    newY: number
  ) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const bubble = panel.bubbles.find((b) => b.id === bubbleId);
    if (!bubble) return;

    const beforeBubble = { ...bubble };
    const afterBubble = { ...bubble, x: newX, y: newY };

    recordBubbleMove(panelId, bubbleId, beforeBubble, afterBubble);

    const updatedBubbles = panel.bubbles.map((b) =>
      b.id === bubbleId ? afterBubble : b
    );
    await updatePanel(panelId, { bubbles: updatedBubbles });
  };

  /**
   * Resize bubble with history tracking
   */
  const resizeBubble = async (
    panelId: string,
    bubbleId: string,
    newWidth: number,
    newHeight: number
  ) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const bubble = panel.bubbles.find((b) => b.id === bubbleId);
    if (!bubble) return;

    const beforeBubble = { ...bubble };
    const afterBubble = { ...bubble, width: newWidth, height: newHeight };

    recordBubbleResize(panelId, bubbleId, beforeBubble, afterBubble);

    const updatedBubbles = panel.bubbles.map((b) =>
      b.id === bubbleId ? afterBubble : b
    );
    await updatePanel(panelId, { bubbles: updatedBubbles });
  };

  /**
   * Delete bubble with history tracking
   */
  const deleteBubble = async (panelId: string, bubbleId: string) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    const bubble = panel.bubbles.find((b) => b.id === bubbleId);
    if (!bubble) return;

    recordBubbleDelete(panelId, bubble);

    const updatedBubbles = panel.bubbles.filter((b) => b.id !== bubbleId);
    await updatePanel(panelId, { bubbles: updatedBubbles });
  };

  /**
   * Create bubble with history tracking
   */
  const createBubble = async (panelId: string, bubble: SpeechBubble) => {
    const panel = getPanelById(panelId);
    if (!panel) return;

    recordBubbleCreate(panelId, bubble);

    const updatedBubbles = [...panel.bubbles, bubble];
    await updatePanel(panelId, { bubbles: updatedBubbles });
  };

  return {
    movePanel,
    resizePanel,
    deletePanelsWithHistory,
    editPanel,
    editBubbleText,
    moveBubble,
    resizeBubble,
    deleteBubble,
    createBubble,
  };
}
