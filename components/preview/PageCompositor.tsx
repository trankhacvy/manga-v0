"use client";

import { useEffect, useRef, useState } from "react";
import { PageRenderer } from "@/lib/rendering/page-renderer";
import { BubbleRenderer } from "@/lib/rendering/bubble-renderer";
import type { PageModel, PanelModel } from "@/types/models";
import type {
  RenderedPage,
  RenderedPanel,
  RenderedBubble,
} from "@/types/layouts";

interface Bubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: string;
}

interface Panel {
  id: string;
  panelIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  relativeX?: number;
  relativeY?: number;
  relativeWidth?: number;
  relativeHeight?: number;
  zIndex?: number;
  panelType?: string;
  borderStyle?: string;
  borderWidth?: number;
  panelMargins?: any;
  imageUrl?: string;
  bubbles: Bubble[];
}

interface Page {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  layoutSuggestion?: string;
  panels: Panel[];
}

interface PageCompositorProps {
  page: Page;
  className?: string;
  showPageNumber?: boolean;
}

class CanvasPageRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pageRenderer: PageRenderer;
  private bubbleRenderer: BubbleRenderer;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;
    this.pageRenderer = new PageRenderer();
    this.bubbleRenderer = new BubbleRenderer();
  }

  async composePage(page: Page, showPageNumber: boolean = true): Promise<void> {
    // Convert legacy Page format to PageModel if needed
    const pageModel = this.convertToPageModel(page);
    const panelModels = this.convertToPanelModels(page.panels);

    // Use new rendering system to calculate positions
    let renderedPage: RenderedPage;
    try {
      renderedPage = this.pageRenderer.renderPage(pageModel, panelModels);
    } catch (error) {
      console.warn(
        "Failed to use new renderer, falling back to legacy:",
        error
      );
      // Fallback to legacy rendering
      await this.composeLegacyPage(page, showPageNumber);
      return;
    }

    // Preload all panel images in parallel for faster rendering
    await this.preloadPanelImages(page.panels);

    // Set canvas size
    this.canvas.width = renderedPage.width;
    this.canvas.height = renderedPage.height;

    // White background
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, renderedPage.width, renderedPage.height);

    // Draw safe area guide (optional, for debugging)
    // this.drawSafeArea(renderedPage.safeArea);

    // Draw each panel using rendered positions
    for (let i = 0; i < renderedPage.panels.length; i++) {
      const renderedPanel = renderedPage.panels[i];
      const originalPanel = page.panels[i];
      await this.drawPanel(renderedPanel, originalPanel);
    }

    // Add page number
    if (showPageNumber) {
      this.drawPageNumber(page.pageNumber);
    }
  }

  private async composeLegacyPage(
    page: Page,
    showPageNumber: boolean
  ): Promise<void> {
    // Preload all panel images in parallel for faster rendering
    await this.preloadPanelImages(page.panels);

    // Set canvas size
    this.canvas.width = page.width;
    this.canvas.height = page.height;

    // White background
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, page.width, page.height);

    // Draw each panel using legacy positions
    for (const panel of page.panels) {
      await this.drawLegacyPanel(panel);
    }

    // Add page number
    if (showPageNumber) {
      this.drawPageNumber(page.pageNumber);
    }
  }

  private async preloadPanelImages(panels: Panel[]): Promise<void> {
    // Collect all unique image URLs
    const imageUrls = panels
      .map((panel) => panel.imageUrl)
      .filter((url): url is string => !!url);

    // Load all images in parallel
    await Promise.all(
      imageUrls.map((url) =>
        this.loadImage(url).catch((err) => {
          console.warn(`Failed to preload image ${url}:`, err);
          return null;
        })
      )
    );
  }

  private convertToPageModel(page: Page): PageModel {
    return {
      id: page.id,
      project_id: "",
      page_number: page.pageNumber,
      width: page.width,
      height: page.height,
      layout_template_id: page.layoutSuggestion || null,
      layout_type: page.layoutSuggestion || null,
      margins: null,
      story_beat: null,
      panel_count: page.panels.length,
      // thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      layout_suggestion: page.layoutSuggestion || null,
    } as PageModel;
  }

  private convertToPanelModels(panels: Panel[]): PanelModel[] {
    return panels.map(
      (panel) =>
        ({
          id: panel.id,
          page_id: "",
          panel_index: panel.panelIndex,
          x: panel.x,
          y: panel.y,
          width: panel.width,
          height: panel.height,
          relative_x: panel.relativeX ?? null,
          relative_y: panel.relativeY ?? null,
          relative_width: panel.relativeWidth ?? null,
          relative_height: panel.relativeHeight ?? null,
          z_index: panel.zIndex ?? null,
          panel_type: panel.panelType ?? null,
          border_style: panel.borderStyle ?? null,
          border_width: panel.borderWidth ?? null,
          panel_margins: panel.panelMargins ?? null,
          image_url: panel.imageUrl || null,
          prompt: "",
          character_ids: [],
          character_handles: null,
          style_locks: null,
          bubbles: panel.bubbles as any,
          bubble_positions: null,
          sketch_url: null,
          controlnet_strength: null,
          generation_params: undefined,
          is_manually_edited: false,
          locked: false,
          thumbnail_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          character_positions: undefined,
          character_refs: [],
        } as any)
    );
  }

  private async drawPanel(
    renderedPanel: RenderedPanel,
    originalPanel: Panel
  ): Promise<void> {
    const { x, y, width, height } = renderedPanel.absolute;
    const borderWidth = renderedPanel.borderWidth;

    // Draw panel background
    this.ctx.fillStyle = "#F5F5F5";
    this.ctx.fillRect(x, y, width, height);

    // Load and draw panel image if available
    if (originalPanel.imageUrl) {
      try {
        const img = await this.loadImage(originalPanel.imageUrl);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();
        this.drawImageCover(img, x, y, width, height);
        this.ctx.restore();
      } catch (error) {
        console.error("Failed to load panel image:", error);
        // Draw placeholder
        this.ctx.fillStyle = "#E0E0E0";
        this.ctx.fillRect(x, y, width, height);
        this.ctx.fillStyle = "#999999";
        this.ctx.font = "14px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
          `Panel ${renderedPanel.panelIndex + 1}`,
          x + width / 2,
          y + height / 2
        );
      }
    }

    // Render bubbles using bubble renderer
    if (originalPanel.bubbles && originalPanel.bubbles.length > 0) {
      const renderedBubbles = this.bubbleRenderer.renderBubbles(
        originalPanel.bubbles as any,
        { x, y, width, height }
      );
      this.drawRenderedBubbles(renderedBubbles);
    }

    // Draw panel border
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = borderWidth;

    if (renderedPanel.borderStyle === "none") {
      // No border
    } else if (renderedPanel.borderStyle === "double") {
      // Double border
      this.ctx.strokeRect(x, y, width, height);
      this.ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
    } else {
      // Solid border (default)
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  private async drawLegacyPanel(panel: Panel): Promise<void> {
    const padding = 4;
    const x = panel.x;
    const y = panel.y;
    const width = panel.width;
    const height = panel.height;

    // Draw panel background
    this.ctx.fillStyle = "#F5F5F5";
    this.ctx.fillRect(
      x + padding,
      y + padding,
      width - padding * 2,
      height - padding * 2
    );

    // Load and draw panel image if available
    if (panel.imageUrl) {
      try {
        const img = await this.loadImage(panel.imageUrl);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(
          x + padding,
          y + padding,
          width - padding * 2,
          height - padding * 2
        );
        this.ctx.clip();
        this.drawImageCover(
          img,
          x + padding,
          y + padding,
          width - padding * 2,
          height - padding * 2
        );
        this.ctx.restore();
      } catch (error) {
        console.error("Failed to load panel image:", error);
        // Draw placeholder
        this.ctx.fillStyle = "#E0E0E0";
        this.ctx.fillRect(
          x + padding,
          y + padding,
          width - padding * 2,
          height - padding * 2
        );
        this.ctx.fillStyle = "#999999";
        this.ctx.font = "14px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
          `Panel ${panel.panelIndex + 1}`,
          x + width / 2,
          y + height / 2
        );
      }
    }

    // Draw speech bubbles on top
    if (panel.bubbles && panel.bubbles.length > 0) {
      this.drawBubbles(panel.bubbles, x, y, width, height);
    }

    // Draw panel border
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      x + padding,
      y + padding,
      width - padding * 2,
      height - padding * 2
    );
  }

  private drawRenderedBubbles(bubbles: RenderedBubble[]): void {
    bubbles.forEach((bubble) => {
      // Draw bubble shape
      this.drawBubbleShape(
        bubble.x,
        bubble.y,
        bubble.width,
        bubble.height,
        bubble.type
      );

      // Draw text
      this.ctx.fillStyle = "#000000";
      const fontSize = this.calculateFontSize(
        bubble.text,
        bubble.width,
        bubble.height
      );
      this.ctx.font = `${fontSize}px "Comic Sans MS", "Manga Temple", sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // Word wrap and draw
      this.drawWrappedText(
        bubble.text,
        bubble.x + bubble.width / 2,
        bubble.y + bubble.height / 2,
        bubble.width - 20
      );
    });
  }

  private drawBubbles(
    bubbles: Bubble[],
    panelX: number,
    panelY: number,
    _panelW: number,
    _panelH: number
  ): void {
    bubbles.forEach((bubble) => {
      const x = panelX + bubble.x;
      const y = panelY + bubble.y;
      const width = bubble.width;
      const height = bubble.height;

      // Draw bubble shape
      this.drawBubbleShape(x, y, width, height, bubble.type);

      // Draw text
      this.ctx.fillStyle = "#000000";
      const fontSize = this.calculateFontSize(bubble.text, width, height);
      this.ctx.font = `${fontSize}px "Comic Sans MS", "Manga Temple", sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // Word wrap and draw
      this.drawWrappedText(
        bubble.text,
        x + width / 2,
        y + height / 2,
        width - 20
      );
    });
  }

  private drawSafeArea(safeArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    this.ctx.strokeStyle = "#FF0000";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      safeArea.x,
      safeArea.y,
      safeArea.width,
      safeArea.height
    );
    this.ctx.setLineDash([]);
  }

  private drawBubbleShape(
    x: number,
    y: number,
    w: number,
    h: number,
    type: string
  ): void {
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;

    switch (type) {
      case "thought":
        // Cloud-shaped thought bubble
        this.drawCloudBubble(x, y, w, h);
        break;
      case "shout":
        // Spiky exclamation bubble
        this.drawSpikyBubble(x, y, w, h);
        break;
      case "whisper":
        // Dashed border for whisper
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        break;
      default:
        // Standard speech bubble (oval)
        this.ctx.beginPath();
        this.ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        break;
    }
  }

  private drawCloudBubble(x: number, y: number, w: number, h: number): void {
    // Draw multiple circles to create cloud effect
    const circles = [
      { x: x + w * 0.2, y: y + h * 0.3, r: w * 0.15 },
      { x: x + w * 0.5, y: y + h * 0.2, r: w * 0.2 },
      { x: x + w * 0.8, y: y + h * 0.3, r: w * 0.15 },
      { x: x + w * 0.3, y: y + h * 0.7, r: w * 0.15 },
      { x: x + w * 0.7, y: y + h * 0.7, r: w * 0.15 },
      { x: x + w * 0.5, y: y + h * 0.5, r: w * 0.25 },
    ];

    circles.forEach((circle) => {
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  private drawSpikyBubble(x: number, y: number, w: number, h: number): void {
    const spikes = 8;
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const outerRadiusX = w / 2;
    const outerRadiusY = h / 2;
    const innerRadiusX = outerRadiusX * 0.7;
    const innerRadiusY = outerRadiusY * 0.7;

    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radiusX = i % 2 === 0 ? outerRadiusX : innerRadiusX;
      const radiusY = i % 2 === 0 ? outerRadiusY : innerRadiusY;
      const px = centerX + Math.cos(angle) * radiusX;
      const py = centerY + Math.sin(angle) * radiusY;

      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private calculateFontSize(
    text: string,
    width: number,
    height: number
  ): number {
    const baseSize = Math.min(width, height) / 8;
    const textLength = text.length;
    const scaleFactor = Math.max(0.5, 1 - textLength / 100);
    return Math.max(12, Math.min(24, baseSize * scaleFactor));
  }

  private drawWrappedText(
    text: string,
    x: number,
    y: number,
    maxWidth: number
  ): void {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    const lineHeight = parseInt(this.ctx.font) * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      this.ctx.fillText(line, x, startY + index * lineHeight);
    });
  }

  private drawPageNumber(pageNumber: number): void {
    this.ctx.fillStyle = "#666666";
    this.ctx.font = "14px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "bottom";
    this.ctx.fillText(
      `${pageNumber}`,
      this.canvas.width / 2,
      this.canvas.height - 10
    );
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = async () => {
        try {
          // Decode image asynchronously to prevent blocking
          if (img.decode) {
            await img.decode();
          }
          // Cache the loaded image
          this.imageCache.set(url, img);
          resolve(img);
        } catch (decodeError) {
          // If decode fails, still use the image
          console.warn("Image decode failed, using anyway:", decodeError);
          this.imageCache.set(url, img);
          resolve(img);
        }
      };

      img.onerror = reject;
      img.src = url;
    });
  }

  private drawImageCover(
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const imgRatio = img.width / img.height;
    const boxRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let drawX = x;
    let drawY = y;

    if (imgRatio > boxRatio) {
      // Image is wider
      drawWidth = height * imgRatio;
      drawX = x - (drawWidth - width) / 2;
    } else {
      // Image is taller
      drawHeight = width / imgRatio;
      drawY = y - (drawHeight - height) / 2;
    }

    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }
}

export function PageCompositor({
  page,
  className = "",
  showPageNumber = true,
}: PageCompositorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);
        setError(null);
        const renderer = new CanvasPageRenderer(canvasRef.current);
        await renderer.composePage(page, showPageNumber);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to render page:", err);
        setError(err instanceof Error ? err.message : "Failed to render page");
        setIsLoading(false);
      }
    };

    renderPage();
  }, [page, showPageNumber]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-auto shadow-lg rounded-lg"
        style={{ aspectRatio: `${page.width} / ${page.height}` }}
      />
    </div>
  );
}
