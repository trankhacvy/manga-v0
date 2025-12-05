import { NextRequest, NextResponse } from "next/server";
import {
  createCanvas,
  loadImage,
  type CanvasRenderingContext2D as NodeCanvasRenderingContext2D,
  type Image,
} from "canvas";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-auth";
import { createServerSupabaseClient } from "@/lib/auth";
import type { PanelModel, SpeechBubbleModel, PageModel } from "@/types";

/**
 * Export a page to high-resolution image
 * GET /api/export/page?pageId=xxx&format=png&quality=high
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get("pageId");
    const format = searchParams.get("format") || "png";
    const quality = searchParams.get("quality") || "high";

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    // Validate format
    if (!["png", "jpg", "jpeg"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be png, jpg, or jpeg" },
        { status: 400 }
      );
    }

    // Validate quality
    if (!["high", "medium", "low"].includes(quality)) {
      return NextResponse.json(
        { error: "Invalid quality. Must be high, medium, or low" },
        { status: 400 }
      );
    }

    // Get page data from database
    const supabase = await createServerSupabaseClient();
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Get project to verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", page.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user owns the project
    if (project.user_id !== user.id) {
      return forbiddenResponse();
    }

    // Get all panels for this page
    const { data: panels, error: panelsError } = await supabase
      .from("panels")
      .select("*")
      .eq("page_id", pageId)
      .order("panel_index");

    if (panelsError) {
      return NextResponse.json(
        { error: "Failed to fetch panels" },
        { status: 500 }
      );
    }

    // Calculate scale factor based on quality
    const scaleFactor = quality === "high" ? 2 : quality === "medium" ? 1.5 : 1;

    // Render page to image
    const imageBuffer = await renderPageToImage(
      page as PageModel,
      // @ts-expect-error
      (panels as PanelModel[]) || [],
      format as "png" | "jpg" | "jpeg",
      scaleFactor
    );

    // Determine content type
    const contentType = format === "png" ? "image/png" : "image/jpeg";

    // Generate filename
    const filename = `page-${page.page_number}.${format}`;

    // Return image
    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting page:", error);
    return NextResponse.json(
      { error: "Failed to export page" },
      { status: 500 }
    );
  }
}

/**
 * Render a page to an image buffer
 */
async function renderPageToImage(
  page: PageModel,
  panels: PanelModel[],
  format: "png" | "jpg" | "jpeg",
  scaleFactor: number
): Promise<Buffer> {
  // Calculate page dimensions based on panels or use default
  const dimensions = calculatePageDimensions(page, panels);

  // Apply scale factor for high-resolution output
  const canvasWidth = Math.floor(dimensions.width * scaleFactor);
  const canvasHeight = Math.floor(dimensions.height * scaleFactor);

  // Create canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext(
    "2d"
  ) as unknown as NodeCanvasRenderingContext2D;

  // Scale context for high-resolution rendering
  ctx.scale(scaleFactor, scaleFactor);

  // Fill white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Render each panel
  for (const panel of panels) {
    await renderPanelToCanvas(ctx, panel);
  }

  // Convert canvas to buffer
  if (format === "png") {
    return canvas.toBuffer("image/png");
  } else {
    return canvas.toBuffer("image/jpeg", { quality: 0.95 });
  }
}

/**
 * Calculate page dimensions based on page data or panel positions
 */
function calculatePageDimensions(
  page: PageModel,
  panels: PanelModel[]
): { width: number; height: number } {
  // Use page dimensions if available
  if (page.layout_data?.template) {
    // Default manga page size (standard B5 format in pixels at 300dpi)
    // For action-spread, use wider dimensions
    // @ts-expect-error
    const isWide = page.layout_data.template === "action-spread";
    return {
      width: isWide ? 2400 : 1200,
      height: isWide ? 1800 : 1800,
    };
  }

  // Calculate from panels if no page dimensions
  if (panels.length === 0) {
    return { width: 1200, height: 1800 }; // Default manga page size
  }

  // Find the maximum extents
  let maxX = 0;
  let maxY = 0;

  for (const panel of panels) {
    const panelRight = panel.x + panel.width;
    const panelBottom = panel.y + panel.height;
    maxX = Math.max(maxX, panelRight);
    maxY = Math.max(maxY, panelBottom);
  }

  // Add padding
  const padding = 20;
  const width = Math.max(maxX + padding, 1200);
  const height = Math.max(maxY + padding, 1800);

  return { width, height };
}

/**
 * Render a single panel to the canvas
 */
async function renderPanelToCanvas(
  ctx: NodeCanvasRenderingContext2D,
  panel: PanelModel
): Promise<void> {
  // Draw panel border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);

  // Load and draw panel image if available
  if (panel.image_url) {
    try {
      const image = await loadImage(panel.image_url);

      // Draw image to fit panel dimensions
      ctx.drawImage(
        image as unknown as Image,
        panel.x,
        panel.y,
        panel.width,
        panel.height
      );
    } catch (error) {
      console.error(`Failed to load panel image: ${panel.image_url}`, error);
      // Draw placeholder
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(panel.x, panel.y, panel.width, panel.height);

      // Draw "X" to indicate missing image
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(panel.x, panel.y);
      ctx.lineTo(panel.x + panel.width, panel.y + panel.height);
      ctx.moveTo(panel.x + panel.width, panel.y);
      ctx.lineTo(panel.x, panel.y + panel.height);
      ctx.stroke();
    }
  } else {
    // Draw empty panel with light gray fill
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
  }

  // Draw speech bubbles
  if (panel.bubbles && panel.bubbles.length > 0) {
    for (const bubble of panel.bubbles) {
      renderSpeechBubbleToCanvas(ctx, bubble, panel);
    }
  }
}

/**
 * Render a speech bubble to the canvas
 */
function renderSpeechBubbleToCanvas(
  ctx: NodeCanvasRenderingContext2D,
  bubble: SpeechBubbleModel,
  panel: PanelModel
): void {
  const x = panel.x + bubble.x;
  const y = panel.y + bubble.y;
  const width = bubble.width;
  const height = bubble.height;

  // Save context state
  ctx.save();

  // Draw bubble background
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  if (bubble.type === "thought") {
    // Draw ellipse for thought bubbles
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
  } else {
    // Draw rounded rectangle for other bubble types
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw text
  const fontSize =
    bubble.type === "shout" ? 16 : bubble.type === "whisper" ? 10 : 12;
  const fontWeight = bubble.type === "shout" ? "bold" : "normal";

  ctx.fillStyle = "#000000";
  ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Word wrap text
  const lines = wrapText(ctx, bubble.text, width - 20);

  // Calculate starting Y position for centered text
  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  let textY = y + (height - totalTextHeight) / 2 + lineHeight / 2;

  // Draw each line
  for (const line of lines) {
    ctx.fillText(line, x + width / 2, textY);
    textY += lineHeight;
  }

  // Restore context state
  ctx.restore();
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  ctx: NodeCanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
