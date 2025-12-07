// Image Upload Pipeline
// Handles uploading generated images with unique filenames and database updates

import { createServerClient } from "./supabase";
import {
  uploadImageFromUrl,
  uploadImage,
  generateStoragePath,
  STORAGE_BUCKETS,
  type UploadImageResult,
} from "./storage";

/**
 * Options for uploading a panel image
 */
export interface UploadPanelImageOptions {
  projectId: string;
  panelId: string;
  imageUrl: string;
  prompt: string;
  generationParams?: Record<string, any>;
  saveToHistory?: boolean;
}

/**
 * Result of uploading a panel image
 */
export interface UploadPanelImageResult {
  imageUrl: string;
  storagePath: string;
  panelId: string;
  historyId?: string;
}

/**
 * Upload a generated panel image to storage and update database
 * Generates unique filename with project/panel IDs
 * Updates panel record with image URL
 * Optionally saves to generation history
 */
export async function uploadPanelImage(
  options: UploadPanelImageOptions
): Promise<UploadPanelImageResult> {
  const supabase = await createServerClient();

  const {
    projectId,
    panelId,
    imageUrl,
    prompt,
    generationParams = {},
    saveToHistory = true,
  } = options;

  // Fetch current panel data to save previous version to history
  let previousImageUrl: string | undefined;
  let previousPrompt: string | undefined;
  let previousParams: Record<string, any> | undefined;

  if (saveToHistory) {
    const { data: currentPanel, error: fetchError } = await supabase
      .from("panels")
      .select("image_url, prompt, generation_params")
      .eq("id", panelId)
      .single();

    if (!fetchError && currentPanel) {
      // @ts-expect-error
      previousImageUrl = currentPanel.image_url;
      // @ts-expect-error
      previousPrompt = currentPanel.prompt;
      // @ts-expect-error
      previousParams = currentPanel.generation_params;
    }
  }

  // Generate unique storage path with project and panel IDs
  const storagePath = generateStoragePath(
    `panels/${projectId}`,
    panelId,
    "panel.png"
  );

  // Upload image to storage
  const uploadResult = await uploadImageFromUrl(
    imageUrl,
    STORAGE_BUCKETS.PANELS,
    storagePath
  );

  // Save previous version to generation history BEFORE updating
  let historyId: string | undefined;
  if (saveToHistory && previousImageUrl && previousPrompt) {
    const { data: historyRecord, error: historyError } = await supabase
      // @ts-expect-error
      .from("generation_history")
      .insert({
        panel_id: panelId,
        image_url: previousImageUrl,
        prompt: previousPrompt,
        parameters: previousParams || {},
      })
      .select("id")
      .single();

    if (historyError) {
      console.error("Failed to save generation history:", historyError);
      // Non-critical error, continue
    } else {
      historyId = historyRecord?.id;
    }
  }

  // Update panel record with new image URL
  const { error: updateError } = await supabase
    .from("panels")
    .update({
      image_url: uploadResult.url,
      generation_params: {
        ...generationParams,
        prompt,
        timestamp: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", panelId);

  if (updateError) {
    throw new Error(`Failed to update panel record: ${updateError.message}`);
  }

  return {
    imageUrl: uploadResult.url,
    storagePath: uploadResult.path,
    panelId,
    historyId,
  };
}

/**
 * Options for uploading a character reference image
 */
export interface UploadCharacterImageOptions {
  projectId: string;
  characterId: string;
  imageUrl: string;
  imageType: "front" | "side" | "expression";
  expressionIndex?: number;
}

/**
 * Upload a character reference image to storage
 * Generates unique filename with project/character IDs
 */
export async function uploadCharacterImage(
  options: UploadCharacterImageOptions
): Promise<UploadImageResult> {
  const { projectId, characterId, imageUrl, imageType, expressionIndex } =
    options;

  // Generate filename based on image type
  let filename: string;
  if (imageType === "expression" && expressionIndex !== undefined) {
    filename = `expression-${expressionIndex}.png`;
  } else {
    filename = `${imageType}.png`;
  }

  // Generate unique storage path
  const storagePath = generateStoragePath(
    `characters/${projectId}`,
    characterId,
    filename
  );

  // Upload image to storage
  return uploadImageFromUrl(imageUrl, STORAGE_BUCKETS.CHARACTERS, storagePath);
}

/**
 * Options for uploading multiple character images
 */
export interface UploadCharacterSheetOptions {
  projectId: string;
  characterId: string;
  images: {
    front: string;
    side: string;
    expressions: string[];
  };
}

/**
 * Result of uploading a character sheet
 */
export interface UploadCharacterSheetResult {
  front: string;
  side: string;
  expressions: string[];
}

/**
 * Upload a complete character sheet (front, side, expressions)
 * Returns URLs for all uploaded images
 */
export async function uploadCharacterSheet(
  options: UploadCharacterSheetOptions
): Promise<UploadCharacterSheetResult> {
  const { projectId, characterId, images } = options;

  // Upload front and side views in parallel
  const [frontUpload, sideUpload] = await Promise.all([
    uploadCharacterImage({
      projectId,
      characterId,
      imageUrl: images.front,
      imageType: "front",
    }),
    uploadCharacterImage({
      projectId,
      characterId,
      imageUrl: images.side,
      imageType: "side",
    }),
  ]);

  // Upload expression images
  const expressionUploads = await Promise.all(
    images.expressions.map((url, index) =>
      uploadCharacterImage({
        projectId,
        characterId,
        imageUrl: url,
        imageType: "expression",
        expressionIndex: index,
      })
    )
  );

  return {
    front: frontUpload.url,
    side: sideUpload.url,
    expressions: expressionUploads.map((upload) => upload.url),
  };
}

/**
 * Options for uploading a page thumbnail
 */
export interface UploadPageThumbnailOptions {
  projectId: string;
  pageId: string;
  imageUrl: string;
  generateThumbnail?: boolean;
  thumbnailMaxWidth?: number;
  thumbnailMaxHeight?: number;
}

/**
 * Upload a page thumbnail to storage and update database
 * Optionally generates a low-res thumbnail before uploading
 */
export async function uploadPageThumbnail(
  options: UploadPageThumbnailOptions
): Promise<UploadImageResult> {
  const supabase = await createServerClient();
  const {
    projectId,
    pageId,
    imageUrl,
    generateThumbnail: shouldGenerateThumbnail = true,
    thumbnailMaxWidth = 300,
    thumbnailMaxHeight = 400,
  } = options;

  let finalImageUrl = imageUrl;

  // Generate thumbnail if requested
  if (shouldGenerateThumbnail) {
    try {
      // Import dynamically to avoid issues in server context
      const { generateThumbnailFromUrl } = await import("./image-processing");

      const thumbnailBlob = await generateThumbnailFromUrl(imageUrl, {
        maxWidth: thumbnailMaxWidth,
        maxHeight: thumbnailMaxHeight,
        quality: 0.8,
        format: "image/jpeg",
      });

      // Generate unique storage path for thumbnail
      const storagePath = generateStoragePath(
        `thumbnails/${projectId}`,
        pageId,
        "thumbnail.jpg"
      );

      // Upload thumbnail blob to storage
      const uploadResult = await uploadImage({
        file: thumbnailBlob,
        bucket: STORAGE_BUCKETS.THUMBNAILS,
        path: storagePath,
        contentType: "image/jpeg",
      });

      finalImageUrl = uploadResult.url;

      // Update page record with thumbnail URL
      const { error: updateError } = await supabase
        .from("pages")
        .update({
          thumbnail_url: uploadResult.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId);

      if (updateError) {
        throw new Error(`Failed to update page record: ${updateError.message}`);
      }

      return uploadResult;
    } catch (error) {
      console.error(
        "Failed to generate thumbnail, using original image:",
        error
      );
      // Fall back to uploading original image
    }
  }

  // Generate unique storage path
  const storagePath = generateStoragePath(
    `thumbnails/${projectId}`,
    pageId,
    "thumbnail.png"
  );

  // Upload thumbnail to storage
  const uploadResult = await uploadImageFromUrl(
    finalImageUrl,
    STORAGE_BUCKETS.THUMBNAILS,
    storagePath
  );

  // Update page record with thumbnail URL
  const { error: updateError } = await supabase
    .from("pages")
    .update({
      thumbnail_url: uploadResult.url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);

  if (updateError) {
    throw new Error(`Failed to update page record: ${updateError.message}`);
  }

  return uploadResult;
}

/**
 * Options for uploading a sketch image
 */
export interface UploadSketchImageOptions {
  projectId: string;
  panelId: string;
  imageUrl: string;
}

/**
 * Upload a sketch image to storage and update panel record
 */
export async function uploadSketchImage(
  options: UploadSketchImageOptions
): Promise<UploadImageResult> {
  const supabase = await createServerClient();

  const { projectId, panelId, imageUrl } = options;

  // Generate unique storage path
  const storagePath = generateStoragePath(
    `sketches/${projectId}`,
    panelId,
    "sketch.png"
  );

  // Upload sketch to storage
  const uploadResult = await uploadImageFromUrl(
    imageUrl,
    STORAGE_BUCKETS.SKETCHES,
    storagePath
  );

  // Update panel record with sketch URL
  const { error: updateError } = await supabase
    .from("panels")
    .update({
      sketch_url: uploadResult.url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", panelId);

  if (updateError) {
    throw new Error(`Failed to update panel record: ${updateError.message}`);
  }

  return uploadResult;
}

/**
 * Generate a unique filename for an image
 * Format: {prefix}/{projectId}/{timestamp}-{random}-{panelId}.{extension}
 */
export function generateUniqueFilename(
  prefix: string,
  projectId: string,
  panelId: string,
  extension: string = "png"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}/${projectId}/${timestamp}-${random}-${panelId}.${extension}`;
}

/**
 * Batch upload multiple panel images
 * Useful for generating multiple panels at once
 */
export async function uploadPanelImageBatch(
  uploads: UploadPanelImageOptions[]
): Promise<UploadPanelImageResult[]> {
  return Promise.all(uploads.map((options) => uploadPanelImage(options)));
}

/**
 * Generate and upload a page thumbnail from panel images
 * Fetches all panel images for a page and creates a composite thumbnail
 */
export async function generateAndUploadPageThumbnail(
  projectId: string,
  pageId: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<UploadImageResult> {
  const { maxWidth = 300, maxHeight = 400, quality = 0.8 } = options;

  const supabase = await createServerClient();

  // Fetch page data with panels
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("*, panels:panels(image_url)")
    .eq("id", pageId)
    .single();

  if (pageError || !page) {
    throw new Error(`Failed to fetch page: ${pageError?.message}`);
  }

  // Get panel image URLs
  const panelUrls = (page.panels as any[])
    .map((panel) => panel.image_url)
    .filter((url): url is string => !!url);

  if (panelUrls.length === 0) {
    throw new Error("No panel images found for page");
  }

  // Import thumbnail generation function
  const { generatePageThumbnailFromPanels } = await import(
    "./image-processing"
  );

  // Generate thumbnail from panels
  const thumbnailResult = await generatePageThumbnailFromPanels(panelUrls, {
    maxWidth,
    maxHeight,
    quality,
  });

  // Generate unique storage path
  const storagePath = generateStoragePath(
    `thumbnails/${projectId}`,
    pageId,
    "thumbnail.jpg"
  );

  // Upload thumbnail to storage
  const uploadResult = await uploadImage({
    file: thumbnailResult.blob,
    bucket: STORAGE_BUCKETS.THUMBNAILS,
    path: storagePath,
    contentType: "image/jpeg",
  });

  // Update page record with thumbnail URL
  const { error: updateError } = await supabase
    .from("pages")
    .update({
      thumbnail_url: uploadResult.url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);

  if (updateError) {
    throw new Error(`Failed to update page record: ${updateError.message}`);
  }

  return uploadResult;
}

/**
 * Batch generate and upload thumbnails for multiple pages
 */
export async function generateAndUploadPageThumbnailBatch(
  projectId: string,
  pageIds: string[],
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<UploadImageResult[]> {
  return Promise.all(
    pageIds.map((pageId) =>
      generateAndUploadPageThumbnail(projectId, pageId, options)
    )
  );
}

/**
 * Fetch generation history for a panel
 * Returns all previous versions ordered by creation date (newest first)
 */
export async function fetchPanelHistory(
  panelId: string
): Promise<any[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    // @ts-expect-error
    .from("generation_history")
    .select("*")
    .eq("panel_id", panelId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch panel history: ${error.message}`);
  }

  return data || [];
}

/**
 * Restore a panel to a previous version from history
 * Updates the panel with the historical image and prompt
 */
export async function restorePanelFromHistory(
  panelId: string,
  historyId: string
): Promise<void> {
  const supabase = await createServerClient();
  // Fetch the history record
  const { data: historyRecord, error: historyError } = await supabase
    // @ts-expect-error
    .from("generation_history")
    .select("*")
    .eq("id", historyId)
    .single();

  if (historyError || !historyRecord) {
    throw new Error(`Failed to fetch history record: ${historyError?.message}`);
  }

  // Verify the history record belongs to the specified panel
  // @ts-expect-error
  if (historyRecord.panel_id !== panelId) {
    throw new Error("History record does not belong to the specified panel");
  }

  // Fetch current panel data to save it to history before restoring
  const { data: currentPanel, error: fetchError } = await supabase
    .from("panels")
    .select("image_url, prompt, generation_params")
    .eq("id", panelId)
    .single();

  if (fetchError || !currentPanel) {
    throw new Error(`Failed to fetch current panel: ${fetchError?.message}`);
  }

  // Save current version to history before restoring
  if (currentPanel.image_url && currentPanel.prompt) {
    const { error: saveHistoryError } = await supabase
      // @ts-expect-error
      .from("generation_history")
      .insert({
        panel_id: panelId,
        image_url: currentPanel.image_url,
        prompt: currentPanel.prompt,
        parameters: currentPanel.generation_params || {},
      });

    if (saveHistoryError) {
      console.error(
        "Failed to save current version to history:",
        saveHistoryError
      );
      // Non-critical error, continue with restoration
    }
  }

  // Update panel with historical version
  const { error: updateError } = await supabase
    .from("panels")
    .update({
      // @ts-expect-error
      image_url: historyRecord.image_url,
      // @ts-expect-error
      prompt: historyRecord.prompt,
      // @ts-expect-error
      generation_params: historyRecord.parameters,
      updated_at: new Date().toISOString(),
    })
    .eq("id", panelId);

  if (updateError) {
    throw new Error(`Failed to restore panel: ${updateError.message}`);
  }
}
