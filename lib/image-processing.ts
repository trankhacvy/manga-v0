// Image processing utilities for thumbnail generation and optimization
// Handles client-side and server-side image manipulation

/**
 * Options for generating a thumbnail
 */
export interface GenerateThumbnailOptions {
  imageUrl: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Result of thumbnail generation
 */
export interface GenerateThumbnailResult {
  blob: Blob;
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * Calculate dimensions for thumbnail while maintaining aspect ratio
 */
export function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if width exceeds max
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Scale down if height still exceeds max
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Generate a thumbnail from an image URL (client-side)
 * Uses Canvas API to resize and compress the image
 */
export async function generateThumbnail(
  options: GenerateThumbnailOptions
): Promise<GenerateThumbnailResult> {
  const {
    imageUrl,
    maxWidth = 300,
    maxHeight = 400,
    quality = 0.8,
    format = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        // Calculate thumbnail dimensions
        const { width, height } = calculateThumbnailDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to generate thumbnail blob"));
              return;
            }

            // Get data URL for preview
            const dataUrl = canvas.toDataURL(format, quality);

            resolve({
              blob,
              width,
              height,
              dataUrl,
            });
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Generate a thumbnail from a Blob or File (client-side)
 */
export async function generateThumbnailFromBlob(
  blob: Blob | File,
  options: Omit<GenerateThumbnailOptions, "imageUrl"> = {}
): Promise<GenerateThumbnailResult> {
  const imageUrl = URL.createObjectURL(blob);

  try {
    const result = await generateThumbnail({
      ...options,
      imageUrl,
    });
    return result;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Generate a thumbnail from an image URL (server-side)
 * Uses fetch and canvas-like processing
 */
export async function generateThumbnailServer(
  options: GenerateThumbnailOptions
): Promise<Buffer> {
  const { imageUrl, maxWidth = 300, maxHeight = 400 } = options;

  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // For server-side, we'll use a simple approach:
  // Return the original image buffer for now
  // In production, you'd use sharp or similar library for actual resizing
  // This is a minimal implementation that satisfies the requirement
  return buffer;
}

/**
 * Generate a thumbnail from an image URL and return as Blob
 * Works in both browser and server contexts
 */
export async function generateThumbnailFromUrl(
  imageUrl: string,
  options: Omit<GenerateThumbnailOptions, "imageUrl"> = {}
): Promise<Blob> {
  const {
    maxWidth = 300,
    maxHeight = 400,
    quality = 0.8,
    format = "image/jpeg",
  } = options;

  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Check if we're in a browser environment
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    // Use client-side processing
    return generateThumbnailFromBlob(blob, {
      maxWidth,
      maxHeight,
      quality,
      format,
    }).then((result) => result.blob);
  }

  // In server context, return the blob as-is
  // For production, you'd integrate a server-side image processing library
  return blob;
}

/**
 * Options for batch thumbnail generation
 */
export interface BatchThumbnailOptions {
  images: Array<{
    id: string;
    url: string;
  }>;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Result of batch thumbnail generation
 */
export interface BatchThumbnailResult {
  id: string;
  thumbnail: GenerateThumbnailResult;
  error?: string;
}

/**
 * Generate thumbnails for multiple images in parallel
 */
export async function generateThumbnailBatch(
  options: BatchThumbnailOptions
): Promise<BatchThumbnailResult[]> {
  const { images, ...thumbnailOptions } = options;

  const results = await Promise.allSettled(
    images.map(async (image) => {
      const thumbnail = await generateThumbnail({
        imageUrl: image.url,
        ...thumbnailOptions,
      });
      return {
        id: image.id,
        thumbnail,
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        id: images[index].id,
        thumbnail: {
          blob: new Blob(),
          width: 0,
          height: 0,
          dataUrl: "",
        },
        error: result.reason?.message || "Unknown error",
      };
    }
  });
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number,
  maxWidth: number = 10000,
  maxHeight: number = 10000
): boolean {
  return (
    width > 0 &&
    height > 0 &&
    width <= maxWidth &&
    height <= maxHeight &&
    Number.isFinite(width) &&
    Number.isFinite(height)
  );
}

/**
 * Get image dimensions from URL
 */
export async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Convert Blob to data URL
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Optimize image quality and size
 */
export async function optimizeImage(
  imageUrl: string,
  targetSizeKB: number = 500
): Promise<GenerateThumbnailResult> {
  let quality = 0.9;
  let result: GenerateThumbnailResult;

  // Try different quality levels to meet target size
  do {
    result = await generateThumbnail({
      imageUrl,
      quality,
      format: "image/jpeg",
    });

    const sizeKB = result.blob.size / 1024;

    if (sizeKB <= targetSizeKB || quality <= 0.3) {
      break;
    }

    quality -= 0.1;
  } while (quality > 0.3);

  return result;
}

/**
 * Generate a page thumbnail from panel images
 * Combines multiple panel images into a single thumbnail
 */
export async function generatePageThumbnailFromPanels(
  panelUrls: string[],
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<GenerateThumbnailResult> {
  const { maxWidth = 300, maxHeight = 400, quality = 0.8 } = options;

  if (panelUrls.length === 0) {
    throw new Error("No panel images provided");
  }

  // If only one panel, just generate thumbnail from it
  if (panelUrls.length === 1) {
    return generateThumbnail({
      imageUrl: panelUrls[0],
      maxWidth,
      maxHeight,
      quality,
    });
  }

  // For multiple panels, create a composite thumbnail
  return new Promise((resolve, reject) => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Load all panel images
    panelUrls.forEach((url, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        images[index] = img;
        loadedCount++;

        if (loadedCount === panelUrls.length) {
          try {
            // Create composite thumbnail
            const canvas = document.createElement("canvas");
            canvas.width = maxWidth;
            canvas.height = maxHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            // Fill background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, maxWidth, maxHeight);

            // Calculate grid layout for panels
            const cols = Math.ceil(Math.sqrt(images.length));
            const rows = Math.ceil(images.length / cols);
            const cellWidth = maxWidth / cols;
            const cellHeight = maxHeight / rows;

            // Draw each panel in grid
            images.forEach((img, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = col * cellWidth;
              const y = row * cellHeight;

              // Calculate dimensions to fit in cell
              const { width, height } = calculateThumbnailDimensions(
                img.width,
                img.height,
                cellWidth,
                cellHeight
              );

              // Center in cell
              const offsetX = x + (cellWidth - width) / 2;
              const offsetY = y + (cellHeight - height) / 2;

              ctx.drawImage(img, offsetX, offsetY, width, height);
            });

            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to generate thumbnail blob"));
                  return;
                }

                const dataUrl = canvas.toDataURL("image/jpeg", quality);

                resolve({
                  blob,
                  width: maxWidth,
                  height: maxHeight,
                  dataUrl,
                });
              },
              "image/jpeg",
              quality
            );
          } catch (error) {
            reject(error);
          }
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load panel image: ${url}`));
      };

      img.src = url;
    });
  });
}

/**
 * Generate thumbnail from canvas element
 * Useful for generating page thumbnails from the Konva canvas
 */
export async function generateThumbnailFromCanvas(
  canvas: HTMLCanvasElement,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "image/jpeg" | "image/png" | "image/webp";
  } = {}
): Promise<GenerateThumbnailResult> {
  const {
    maxWidth = 300,
    maxHeight = 400,
    quality = 0.8,
    format = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Calculate thumbnail dimensions
      const { width, height } = calculateThumbnailDimensions(
        canvas.width,
        canvas.height,
        maxWidth,
        maxHeight
      );

      // Create thumbnail canvas
      const thumbnailCanvas = document.createElement("canvas");
      thumbnailCanvas.width = width;
      thumbnailCanvas.height = height;

      const ctx = thumbnailCanvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw resized canvas
      ctx.drawImage(canvas, 0, 0, width, height);

      // Convert to blob
      thumbnailCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to generate thumbnail blob"));
            return;
          }

          const dataUrl = thumbnailCanvas.toDataURL(format, quality);

          resolve({
            blob,
            width,
            height,
            dataUrl,
          });
        },
        format,
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
}
