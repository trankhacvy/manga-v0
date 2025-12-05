import type { Panel, SpeechBubble } from "@/types";

export interface MaskRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CommandExecutorContext {
  projectId: string;
  pageId: string;
  panelId: string;
  updatePanel: (panelId: string, updates: Partial<Panel>) => Promise<void>;
  updateSpeechBubble: (
    panelId: string,
    bubbleId: string,
    updates: Partial<SpeechBubble>
  ) => void;
  addSpeechBubble: (panelId: string, bubble: Omit<SpeechBubble, "id">) => void;
  deleteSpeechBubble: (panelId: string, bubbleId: string) => void;
  getPanel: (panelId: string) => Panel | null;
  setMaskToolActive?: (isActive: boolean) => void;
  setMaskMode?: (mode: "rectangle" | "brush") => void;
  getCurrentMaskRegion?: () => MaskRegion | null;
}

interface CommandResult {
  success: boolean;
  message: string;
  error?: string;
}

export class CommandExecutor {
  constructor(private context: CommandExecutorContext) {}

  async execute(
    action: string,
    parameters: Record<string, any>
  ): Promise<CommandResult> {
    try {
      switch (action) {
        case "regenerate":
          return await this.handleRegenerate(parameters);
        case "inpaint":
          return await this.handleInpaint(parameters);
        case "activate_mask_tool":
          return this.handleActivateMaskTool(parameters);
        case "edit_bubble":
          return this.handleEditBubble(parameters);
        case "resize":
          return await this.handleResize(parameters);
        case "add_bubble":
          return this.handleAddBubble(parameters);
        case "delete_bubble":
          return this.handleDeleteBubble(parameters);
        case "info":
          return {
            success: true,
            message: parameters.message || "Information provided.",
          };
        case "error":
          return {
            success: false,
            message: parameters.message || "Command could not be executed.",
          };
        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to execute command",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async handleRegenerate(
    parameters: Record<string, any>
  ): Promise<CommandResult> {
    const panel = this.context.getPanel(this.context.panelId);
    if (!panel) {
      return {
        success: false,
        message: "Panel not found",
      };
    }

    try {
      // Build the new prompt
      let newPrompt = panel.prompt;
      if (parameters.promptModification) {
        newPrompt = `${panel.prompt}, ${parameters.promptModification}`;
      } else if (parameters.newPrompt) {
        newPrompt = parameters.newPrompt;
      }

      // Call the panel generation API
      const response = await fetch("/api/panels/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.context.projectId,
          pageId: this.context.pageId,
          panelId: this.context.panelId,
          prompt: newPrompt,
          characterRefs: panel.characterRefs,
          style: parameters.style,
          controlNetImage: parameters.controlNetImage,
          maskRegion: parameters.maskRegion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      const data = await response.json();

      // Update the panel with the new image URL
      await this.context.updatePanel(this.context.panelId, {
        imageUrl: data.imageUrl,
        prompt: newPrompt,
      });

      return {
        success: true,
        message: "Panel regenerated successfully!",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to regenerate panel",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async handleInpaint(
    parameters: Record<string, any>
  ): Promise<CommandResult> {
    const panel = this.context.getPanel(this.context.panelId);
    if (!panel) {
      return {
        success: false,
        message: "Panel not found",
      };
    }

    if (!panel.imageUrl) {
      return {
        success: false,
        message:
          "Panel has no image to inpaint. Please generate an image first.",
      };
    }

    try {
      // Build the inpainting prompt
      let inpaintPrompt = panel.prompt;
      if (parameters.promptModification) {
        inpaintPrompt = `${panel.prompt}, ${parameters.promptModification}`;
      } else if (parameters.newPrompt) {
        inpaintPrompt = parameters.newPrompt;
      }

      // Determine mask region
      let maskRegion: MaskRegion | undefined;

      // Check if user has manually selected a region
      if (this.context.getCurrentMaskRegion) {
        const currentMask = this.context.getCurrentMaskRegion();
        if (currentMask) {
          maskRegion = currentMask;
        }
      }

      // If no manual mask, try to estimate region from parameters
      if (!maskRegion && parameters.region) {
        maskRegion = this.estimateMaskRegion(panel, parameters.region);
      }

      // If still no mask region, ask user to select one
      if (!maskRegion) {
        if (this.context.setMaskToolActive) {
          this.context.setMaskToolActive(true);
          return {
            success: true,
            message:
              "Please select the region you want to edit using the mask tool, then try the command again.",
          };
        } else {
          return {
            success: false,
            message:
              "Unable to determine the region to edit. Please be more specific or use the mask tool.",
          };
        }
      }

      // Call the panel generation API with inpainting
      const response = await fetch("/api/panels/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.context.projectId,
          pageId: this.context.pageId,
          panelId: this.context.panelId,
          prompt: inpaintPrompt,
          characterRefs: panel.characterRefs,
          style: parameters.style,
          maskRegion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Inpainting failed");
      }

      const data = await response.json();

      // Update the panel with the new image URL
      await this.context.updatePanel(this.context.panelId, {
        imageUrl: data.imageUrl,
        prompt: inpaintPrompt,
      });

      return {
        success: true,
        message: "Region inpainted successfully!",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to inpaint region",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private handleActivateMaskTool(
    parameters: Record<string, any>
  ): CommandResult {
    if (!this.context.setMaskToolActive || !this.context.setMaskMode) {
      return {
        success: false,
        message: "Mask tool is not available in this context.",
      };
    }

    const mode = parameters.mode || "rectangle";
    this.context.setMaskMode(mode);
    this.context.setMaskToolActive(true);

    return {
      success: true,
      message: `Mask tool activated in ${mode} mode. Draw the region you want to edit.`,
    };
  }

  /**
   * Estimate a mask region based on a region description
   * This is a simple heuristic - in production, you might use object detection
   */
  private estimateMaskRegion(
    panel: Panel,
    regionDescription: string
  ): MaskRegion | undefined {
    const desc = regionDescription.toLowerCase();

    // Simple heuristics for common regions
    if (
      desc.includes("face") ||
      desc.includes("head") ||
      desc.includes("expression")
    ) {
      // Assume face is in upper-center third
      return {
        x: panel.x + panel.width * 0.25,
        y: panel.y + panel.height * 0.1,
        w: panel.width * 0.5,
        h: panel.height * 0.4,
      };
    }

    if (desc.includes("hand") || desc.includes("hands")) {
      // Assume hands are in lower-center area
      return {
        x: panel.x + panel.width * 0.2,
        y: panel.y + panel.height * 0.5,
        w: panel.width * 0.6,
        h: panel.height * 0.4,
      };
    }

    if (desc.includes("background") || desc.includes("bg")) {
      // Entire panel but with some margin
      return {
        x: panel.x + 10,
        y: panel.y + 10,
        w: panel.width - 20,
        h: panel.height - 20,
      };
    }

    if (desc.includes("top") || desc.includes("upper")) {
      return {
        x: panel.x + panel.width * 0.1,
        y: panel.y + 10,
        w: panel.width * 0.8,
        h: panel.height * 0.4,
      };
    }

    if (desc.includes("bottom") || desc.includes("lower")) {
      return {
        x: panel.x + panel.width * 0.1,
        y: panel.y + panel.height * 0.6,
        w: panel.width * 0.8,
        h: panel.height * 0.35,
      };
    }

    if (desc.includes("left")) {
      return {
        x: panel.x + 10,
        y: panel.y + panel.height * 0.1,
        w: panel.width * 0.4,
        h: panel.height * 0.8,
      };
    }

    if (desc.includes("right")) {
      return {
        x: panel.x + panel.width * 0.6,
        y: panel.y + panel.height * 0.1,
        w: panel.width * 0.35,
        h: panel.height * 0.8,
      };
    }

    if (desc.includes("center") || desc.includes("middle")) {
      return {
        x: panel.x + panel.width * 0.25,
        y: panel.y + panel.height * 0.25,
        w: panel.width * 0.5,
        h: panel.height * 0.5,
      };
    }

    // If we can't determine the region, return undefined
    return undefined;
  }

  private handleEditBubble(parameters: Record<string, any>): CommandResult {
    const panel = this.context.getPanel(this.context.panelId);
    if (!panel) {
      return {
        success: false,
        message: "Panel not found",
      };
    }

    const { bubbleIndex, bubbleId, newText } = parameters;

    // Find the bubble to edit
    let targetBubble: SpeechBubble | undefined;
    if (bubbleId) {
      targetBubble = panel.bubbles.find((b) => b.id === bubbleId);
    } else if (typeof bubbleIndex === "number") {
      targetBubble = panel.bubbles[bubbleIndex];
    } else {
      // Default to first bubble if not specified
      targetBubble = panel.bubbles[0];
    }

    if (!targetBubble) {
      return {
        success: false,
        message: "Speech bubble not found",
      };
    }

    // Update the bubble text
    this.context.updateSpeechBubble(this.context.panelId, targetBubble.id, {
      text: newText,
    });

    return {
      success: true,
      message: "Speech bubble updated successfully!",
    };
  }

  private async handleResize(
    parameters: Record<string, any>
  ): Promise<CommandResult> {
    const panel = this.context.getPanel(this.context.panelId);
    if (!panel) {
      return {
        success: false,
        message: "Panel not found",
      };
    }

    const {
      widthMultiplier = 1,
      heightMultiplier = 1,
      newWidth,
      newHeight,
    } = parameters;

    // Calculate new dimensions
    const width = newWidth || panel.width * widthMultiplier;
    const height = newHeight || panel.height * heightMultiplier;

    // Check if panel is growing (may need outpainting)
    const isGrowing = width > panel.width || height > panel.height;

    if (isGrowing && panel.imageUrl) {
      // TODO: Implement outpainting when panel grows
      // For now, just resize without regenerating
      await this.context.updatePanel(this.context.panelId, {
        width,
        height,
      });

      return {
        success: true,
        message:
          "Panel resized. Note: Outpainting for larger panels is not yet implemented.",
      };
    }

    // Simple resize
    await this.context.updatePanel(this.context.panelId, {
      width,
      height,
    });

    return {
      success: true,
      message: "Panel resized successfully!",
    };
  }

  private handleAddBubble(parameters: Record<string, any>): CommandResult {
    const panel = this.context.getPanel(this.context.panelId);
    if (!panel) {
      return {
        success: false,
        message: "Panel not found",
      };
    }

    const {
      text,
      type = "standard",
      x,
      y,
      width = 100,
      height = 60,
    } = parameters;

    if (!text) {
      return {
        success: false,
        message: "Bubble text is required",
      };
    }

    // Calculate position if not provided (center of panel)
    const bubbleX = x ?? panel.x + panel.width / 2 - width / 2;
    const bubbleY = y ?? panel.y + panel.height / 4;

    const newBubble: Omit<SpeechBubble, "id"> = {
      x: bubbleX,
      y: bubbleY,
      width,
      height,
      text,
      type,
    };

    this.context.addSpeechBubble(this.context.panelId, newBubble);

    return {
      success: true,
      message: "Speech bubble added successfully!",
    };
  }

  private handleDeleteBubble(parameters: Record<string, any>): CommandResult {
    const panel = this.context.getPanel(this.context.panelId);
    if (!panel) {
      return {
        success: false,
        message: "Panel not found",
      };
    }

    const { bubbleIndex, bubbleId } = parameters;

    // Find the bubble to delete
    let targetBubble: SpeechBubble | undefined;
    if (bubbleId) {
      targetBubble = panel.bubbles.find((b) => b.id === bubbleId);
    } else if (typeof bubbleIndex === "number") {
      targetBubble = panel.bubbles[bubbleIndex];
    } else {
      // Default to last bubble if not specified
      targetBubble = panel.bubbles[panel.bubbles.length - 1];
    }

    if (!targetBubble) {
      return {
        success: false,
        message: "Speech bubble not found",
      };
    }

    this.context.deleteSpeechBubble(this.context.panelId, targetBubble.id);

    return {
      success: true,
      message: "Speech bubble deleted successfully!",
    };
  }
}
