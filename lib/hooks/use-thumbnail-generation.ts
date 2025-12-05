// Hook for generating thumbnails in React components
// Provides utilities for client-side thumbnail generation

import { useState, useCallback } from "react";
import {
  generateThumbnail,
  generateThumbnailFromBlob,
  generatePageThumbnailFromPanels,
  generateThumbnailFromCanvas,
  type GenerateThumbnailResult,
} from "@/lib/image-processing";

export interface UseThumbnailGenerationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

export interface UseThumbnailGenerationResult {
  generateFromUrl: (url: string) => Promise<GenerateThumbnailResult>;
  generateFromBlob: (blob: Blob | File) => Promise<GenerateThumbnailResult>;
  generateFromPanels: (urls: string[]) => Promise<GenerateThumbnailResult>;
  generateFromCanvas: (
    canvas: HTMLCanvasElement
  ) => Promise<GenerateThumbnailResult>;
  uploadPageThumbnail: (
    projectId: string,
    pageId: string
  ) => Promise<{ thumbnailUrl: string }>;
  isGenerating: boolean;
  error: Error | null;
}

/**
 * Hook for generating thumbnails with loading and error states
 */
export function useThumbnailGeneration(
  options: UseThumbnailGenerationOptions = {}
): UseThumbnailGenerationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    maxWidth = 300,
    maxHeight = 400,
    quality = 0.8,
    format = "image/jpeg",
  } = options;

  const generateFromUrl = useCallback(
    async (url: string): Promise<GenerateThumbnailResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateThumbnail({
          imageUrl: url,
          maxWidth,
          maxHeight,
          quality,
          format,
        });
        return result;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to generate thumbnail");
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [maxWidth, maxHeight, quality, format]
  );

  const generateFromBlob = useCallback(
    async (blob: Blob | File): Promise<GenerateThumbnailResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateThumbnailFromBlob(blob, {
          maxWidth,
          maxHeight,
          quality,
          format,
        });
        return result;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to generate thumbnail");
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [maxWidth, maxHeight, quality, format]
  );

  const generateFromPanels = useCallback(
    async (urls: string[]): Promise<GenerateThumbnailResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generatePageThumbnailFromPanels(urls, {
          maxWidth,
          maxHeight,
          quality,
        });
        return result;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to generate thumbnail");
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [maxWidth, maxHeight, quality]
  );

  const generateFromCanvas = useCallback(
    async (canvas: HTMLCanvasElement): Promise<GenerateThumbnailResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateThumbnailFromCanvas(canvas, {
          maxWidth,
          maxHeight,
          quality,
          format,
        });
        return result;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to generate thumbnail");
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [maxWidth, maxHeight, quality, format]
  );

  const uploadPageThumbnail = useCallback(
    async (
      projectId: string,
      pageId: string
    ): Promise<{ thumbnailUrl: string }> => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch(`/api/pages/${pageId}/thumbnail`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            maxWidth,
            maxHeight,
            quality,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload thumbnail");
        }

        const data = await response.json();
        return { thumbnailUrl: data.thumbnailUrl };
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to upload thumbnail");
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [maxWidth, maxHeight, quality]
  );

  return {
    generateFromUrl,
    generateFromBlob,
    generateFromPanels,
    generateFromCanvas,
    uploadPageThumbnail,
    isGenerating,
    error,
  };
}
