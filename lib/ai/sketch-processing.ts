// /**
//  * Sketch Processing Utilities
//  * Handles sketch upload, preprocessing, and conversion for ControlNet
//  */

// export interface SketchProcessingOptions {
//   maxWidth?: number;
//   maxHeight?: number;
//   format?: "png" | "jpeg" | "webp";
//   quality?: number;
//   enhanceLines?: boolean;
//   invertColors?: boolean;
// }

// export interface ProcessedSketch {
//   dataUrl: string;
//   width: number;
//   height: number;
//   format: string;
//   size: number;
// }

// /**
//  * Process uploaded sketch file for ControlNet
//  */
// export async function processSketchFile(
//   file: File,
//   options: SketchProcessingOptions = {}
// ): Promise<ProcessedSketch> {
//   const {
//     maxWidth = 1024,
//     maxHeight = 1024,
//     format = "png",
//     quality = 0.95,
//     enhanceLines = false,
//     invertColors = false,
//   } = options;

//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();

//     reader.onload = (e) => {
//       const img = new Image();

//       img.onload = () => {
//         // Calculate dimensions maintaining aspect ratio
//         let width = img.width;
//         let height = img.height;

//         if (width > maxWidth || height > maxHeight) {
//           const ratio = Math.min(maxWidth / width, maxHeight / height);
//           width = Math.floor(width * ratio);
//           height = Math.floor(height * ratio);
//         }

//         // Create canvas for processing
//         const canvas = document.createElement("canvas");
//         canvas.width = width;
//         canvas.height = height;
//         const ctx = canvas.getContext("2d");

//         if (!ctx) {
//           reject(new Error("Failed to get canvas context"));
//           return;
//         }

//         // Draw image
//         ctx.drawImage(img, 0, 0, width, height);

//         // Apply processing
//         if (enhanceLines || invertColors) {
//           const imageData = ctx.getImageData(0, 0, width, height);
//           const data = imageData.data;

//           for (let i = 0; i < data.length; i += 4) {
//             if (invertColors) {
//               // Invert colors
//               data[i] = 255 - data[i]; // R
//               data[i + 1] = 255 - data[i + 1]; // G
//               data[i + 2] = 255 - data[i + 2]; // B
//             }

//             if (enhanceLines) {
//               // Enhance contrast for line art
//               const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
//               const enhanced = avg < 128 ? 0 : 255;
//               data[i] = enhanced;
//               data[i + 1] = enhanced;
//               data[i + 2] = enhanced;
//             }
//           }

//           ctx.putImageData(imageData, 0, 0);
//         }

//         // Convert to data URL
//         const mimeType = `image/${format}`;
//         const dataUrl = canvas.toDataURL(mimeType, quality);

//         resolve({
//           dataUrl,
//           width,
//           height,
//           format,
//           size: dataUrl.length,
//         });
//       };

//       img.onerror = () => {
//         reject(new Error("Failed to load image"));
//       };

//       img.src = e.target?.result as string;
//     };

//     reader.onerror = () => {
//       reject(new Error("Failed to read file"));
//     };

//     reader.readAsDataURL(file);
//   });
// }

// /**
//  * Convert canvas drawing to sketch data URL
//  */
// export function canvasToSketchDataUrl(
//   canvas: HTMLCanvasElement,
//   options: {
//     format?: "png" | "jpeg" | "webp";
//     quality?: number;
//     backgroundColor?: string;
//   } = {}
// ): string {
//   const { format = "png", quality = 0.95, backgroundColor } = options;

//   // If background color is specified, create a new canvas with background
//   if (backgroundColor) {
//     const tempCanvas = document.createElement("canvas");
//     tempCanvas.width = canvas.width;
//     tempCanvas.height = canvas.height;
//     const ctx = tempCanvas.getContext("2d");

//     if (ctx) {
//       ctx.fillStyle = backgroundColor;
//       ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
//       ctx.drawImage(canvas, 0, 0);
//       return tempCanvas.toDataURL(`image/${format}`, quality);
//     }
//   }

//   return canvas.toDataURL(`image/${format}`, quality);
// }

// /**
//  * Upload sketch to storage and return URL
//  */
// export async function uploadSketch(
//   projectId: string,
//   panelId: string,
//   sketchDataUrl: string
// ): Promise<string> {
//   try {
//     // Convert data URL to blob
//     const response = await fetch(sketchDataUrl);
//     const blob = await response.blob();

//     // Create form data
//     const formData = new FormData();
//     formData.append("file", blob, `sketch-${panelId}.png`);
//     formData.append("projectId", projectId);
//     formData.append("panelId", panelId);

//     // Upload to storage API
//     const uploadResponse = await fetch("/api/storage/upload-sketch", {
//       method: "POST",
//       body: formData,
//     });

//     if (!uploadResponse.ok) {
//       throw new Error("Failed to upload sketch");
//     }

//     const result = await uploadResponse.json();
//     return result.url;
//   } catch (error) {
//     console.error("Sketch upload error:", error);
//     throw error;
//   }
// }

// /**
//  * Validate sketch dimensions
//  */
// export function validateSketchDimensions(
//   width: number,
//   height: number
// ): {
//   valid: boolean;
//   errors: string[];
//   warnings: string[];
// } {
//   const errors: string[] = [];
//   const warnings: string[] = [];

//   // Minimum dimensions
//   if (width < 256 || height < 256) {
//     errors.push("Sketch dimensions must be at least 256x256 pixels");
//   }

//   // Maximum dimensions
//   if (width > 2048 || height > 2048) {
//     warnings.push(
//       "Sketch dimensions are very large, will be resized to 2048x2048"
//     );
//   }

//   // Aspect ratio check
//   const aspectRatio = width / height;
//   if (aspectRatio < 0.5 || aspectRatio > 2.0) {
//     warnings.push(
//       "Unusual aspect ratio detected, may affect generation quality"
//     );
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//     warnings,
//   };
// }

// /**
//  * Extract sketch from image (convert to line art)
//  */
// export async function extractSketchFromImage(
//   imageUrl: string,
//   options: {
//     threshold?: number;
//     blur?: number;
//   } = {}
// ): Promise<string> {
//   const { threshold = 128, blur = 0 } = options;

//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = "anonymous";

//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height;
//       const ctx = canvas.getContext("2d");

//       if (!ctx) {
//         reject(new Error("Failed to get canvas context"));
//         return;
//       }

//       // Draw image
//       ctx.drawImage(img, 0, 0);

//       // Apply blur if specified
//       if (blur > 0) {
//         ctx.filter = `blur(${blur}px)`;
//         ctx.drawImage(canvas, 0, 0);
//         ctx.filter = "none";
//       }

//       // Convert to grayscale and apply threshold
//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const data = imageData.data;

//       for (let i = 0; i < data.length; i += 4) {
//         // Convert to grayscale
//         const gray =
//           data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

//         // Apply threshold
//         const value = gray < threshold ? 0 : 255;

//         data[i] = value;
//         data[i + 1] = value;
//         data[i + 2] = value;
//       }

//       ctx.putImageData(imageData, 0, 0);

//       resolve(canvas.toDataURL("image/png"));
//     };

//     img.onerror = () => {
//       reject(new Error("Failed to load image"));
//     };

//     img.src = imageUrl;
//   });
// }

// /**
//  * Create sketch preview thumbnail
//  */
// export function createSketchThumbnail(
//   sketchDataUrl: string,
//   maxSize: number = 200
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const img = new Image();

//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       const aspectRatio = img.width / img.height;

//       let width = maxSize;
//       let height = maxSize;

//       if (aspectRatio > 1) {
//         height = maxSize / aspectRatio;
//       } else {
//         width = maxSize * aspectRatio;
//       }

//       canvas.width = width;
//       canvas.height = height;

//       const ctx = canvas.getContext("2d");
//       if (!ctx) {
//         reject(new Error("Failed to get canvas context"));
//         return;
//       }

//       ctx.drawImage(img, 0, 0, width, height);
//       resolve(canvas.toDataURL("image/png", 0.8));
//     };

//     img.onerror = () => {
//       reject(new Error("Failed to load sketch"));
//     };

//     img.src = sketchDataUrl;
//   });
// }
