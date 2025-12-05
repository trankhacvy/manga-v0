import type { Page, Panel } from "@/types";

/**
 * Generate a thumbnail image for a page by compositing all panel images
 * @param page - The page to generate thumbnail for
 * @param panels - All panels on the page
 * @returns Promise resolving to thumbnail data URL
 */
export async function generatePageThumbnail(
  page: Page,
  panels: Panel[]
): Promise<string> {
  // Create an offscreen canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set thumbnail dimensions (maintain aspect ratio)
  const thumbnailWidth = 200;
  const aspectRatio = page.height / page.width;
  const thumbnailHeight = Math.round(thumbnailWidth * aspectRatio);

  canvas.width = thumbnailWidth;
  canvas.height = thumbnailHeight;

  // Calculate scale factor
  const scaleX = thumbnailWidth / page.width;
  const scaleY = thumbnailHeight / page.height;

  // Fill background with white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

  // Load and draw all panel images
  const imagePromises = panels
    .filter((panel) => panel.imageUrl) // Only panels with images
    .map(async (panel) => {
      try {
        const img = await loadImage(panel.imageUrl!);

        // Calculate scaled position and size
        const scaledX = panel.x * scaleX;
        const scaledY = panel.y * scaleY;
        const scaledWidth = panel.width * scaleX;
        const scaledHeight = panel.height * scaleY;

        // Draw the panel image
        ctx.drawImage(img, scaledX, scaledY, scaledWidth, scaledHeight);

        // Draw panel border
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      } catch (error) {
        console.error(`Failed to load panel image: ${panel.imageUrl}`, error);
        // Draw placeholder rectangle for failed images
        const scaledX = panel.x * scaleX;
        const scaledY = panel.y * scaleY;
        const scaledWidth = panel.width * scaleX;
        const scaledHeight = panel.height * scaleY;

        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      }
    });

  // Wait for all images to load and draw
  await Promise.all(imagePromises);

  // Convert canvas to data URL
  return canvas.toDataURL("image/png", 0.8);
}

/**
 * Load an image from URL
 * @param url - Image URL
 * @returns Promise resolving to HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Generate thumbnail from a single panel
 * @param panel - The panel to generate thumbnail for
 * @param width - Thumbnail width
 * @param height - Thumbnail height
 * @returns Promise resolving to thumbnail data URL
 */
export async function generatePanelThumbnail(
  panel: Panel,
  width: number = 150,
  height: number = 150
): Promise<string> {
  if (!panel.imageUrl) {
    throw new Error("Panel has no image URL");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = width;
  canvas.height = height;

  try {
    const img = await loadImage(panel.imageUrl);

    // Calculate aspect ratio fit
    const imgAspect = img.width / img.height;
    const thumbAspect = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > thumbAspect) {
      // Image is wider - fit to height
      drawHeight = height;
      drawWidth = height * imgAspect;
      offsetX = (width - drawWidth) / 2;
    } else {
      // Image is taller - fit to width
      drawWidth = width;
      drawHeight = width / imgAspect;
      offsetY = (height - drawHeight) / 2;
    }

    // Fill background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    return canvas.toDataURL("image/png", 0.8);
  } catch (error) {
    console.error("Failed to generate panel thumbnail:", error);
    throw error;
  }
}

/**
 * Cache for generated thumbnails
 */
const thumbnailCache = new Map<string, string>();

/**
 * Get cached thumbnail or generate new one
 * @param key - Cache key (usually page or panel ID)
 * @param generator - Function to generate thumbnail if not cached
 * @returns Promise resolving to thumbnail data URL
 */
export async function getCachedThumbnail(
  key: string,
  generator: () => Promise<string>
): Promise<string> {
  if (thumbnailCache.has(key)) {
    return thumbnailCache.get(key)!;
  }

  const thumbnail = await generator();
  thumbnailCache.set(key, thumbnail);
  return thumbnail;
}

/**
 * Clear thumbnail cache
 * @param key - Optional key to clear specific thumbnail, or clear all if not provided
 */
export function clearThumbnailCache(key?: string): void {
  if (key) {
    thumbnailCache.delete(key);
  } else {
    thumbnailCache.clear();
  }
}
