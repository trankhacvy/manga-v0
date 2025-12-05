// Cloud storage utilities for image upload/download
// Supports Supabase Storage as primary option

import { createServerClient } from "./supabase";

export interface UploadImageOptions {
  file: File | Blob;
  bucket: string;
  path: string;
  contentType?: string;
}

export interface UploadImageResult {
  url: string;
  path: string;
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(
  options: UploadImageOptions
): Promise<UploadImageResult> {
  const { file, bucket, path, contentType } = options;
  const supabase = await createServerClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Upload an image from a URL (for AI-generated images)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  bucket: string,
  path: string
): Promise<UploadImageResult> {
  console.log("imageUrl", imageUrl);
  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }

  const blob = await response.blob();

  return uploadImage({
    file: blob,
    bucket,
    path,
    contentType: blob.type,
  });
}

/**
 * Delete an image from storage
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Generate a unique filename for storage
 */
export function generateStoragePath(
  prefix: string,
  projectId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = filename.split(".").pop() || "png";
  return `${prefix}/${projectId}/${timestamp}-${random}.${extension}`;
}

/**
 * Generate a signed URL for temporary secure access
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error("No signed URL returned from Supabase");
  }

  return data.signedUrl;
}

/**
 * Get public URL for a file (for public buckets)
 */
export async function getPublicUrl(
  bucket: string,
  path: string
): Promise<string> {
  const supabase = await createServerClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/**
 * List files in a bucket path
 */
export async function listFiles(
  bucket: string,
  path: string = ""
): Promise<Array<{ name: string; id: string; metadata: any }>> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.storage.from(bucket).list(path);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data || [];
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      return false;
    }

    return data && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Storage bucket names used in the application
 */
export const STORAGE_BUCKETS = {
  PANELS: "manga-panels",
  CHARACTERS: "character-references",
  THUMBNAILS: "page-thumbnails",
  SKETCHES: "panel-sketches",
} as const;

/**
 * Get the appropriate bucket for a given resource type
 */
export function getBucketForResource(
  resourceType: "panel" | "character" | "thumbnail" | "sketch"
): string {
  switch (resourceType) {
    case "panel":
      return STORAGE_BUCKETS.PANELS;
    case "character":
      return STORAGE_BUCKETS.CHARACTERS;
    case "thumbnail":
      return STORAGE_BUCKETS.THUMBNAILS;
    case "sketch":
      return STORAGE_BUCKETS.SKETCHES;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
}
