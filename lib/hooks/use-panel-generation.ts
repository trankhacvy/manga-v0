// Client-side hook for panel generation with progress tracking

"use client";

import { useState, useCallback } from "react";
import { useCanvasStore } from "@/lib/store/canvas-store";
import type { StyleType } from "@/types";

export interface GeneratePanelOptions {
  projectId: string;
  pageId: string;
  panelId: string;
  prompt: string;
  characterRefs?: string[];
  style: StyleType;
  controlNetImage?: string;
  controlNetStrength?: number;
  width?: number;
  height?: number;
  seed?: number;
}

export interface GeneratePanelResult {
  success: boolean;
  imageUrl?: string;
  generationId?: string;
  seed?: number;
  error?: string;
  retryable?: boolean;
}

export function usePanelGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOptions, setLastOptions] = useState<GeneratePanelOptions | null>(
    null
  );
  // const {
  //   setGenerating,
  //   setGenerationProgress,
  //   setGenerationError,
  //   clearGenerationError,
  //   updatePanel,
  // } = useCanvasStore();

  // const generatePanel = useCallback(
  //   async (options: GeneratePanelOptions): Promise<GeneratePanelResult> => {
  //     try {
  //       setIsGenerating(true);
  //       setError(null);
  //       setLastOptions(options);
  //       // clearGenerationError();
  //       // setGenerating(true, options.panelId);
  //       // setGenerationProgress(0);

  //       // Simulate initial progress
  //       // setGenerationProgress(5);

  //       // Call the API
  //       const response = await fetch("/api/panels/generate", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(options),
  //       });

  //       // Update progress during request
  //       // setGenerationProgress(30);

  //       const data = await response.json();

  //       if (!response.ok) {
  //         throw new Error(data.error || "Failed to generate panel");
  //       }

  //       // Complete progress
  //       // setGenerationProgress(100);

  //       // Update panel in store with new image
  //       if (data.imageUrl) {
  //         // await updatePanel(options.panelId, {
  //         //   imageUrl: data.imageUrl,
  //         // });
  //       }

  //       return {
  //         success: true,
  //         imageUrl: data.imageUrl,
  //         generationId: data.generationId,
  //         seed: data.seed,
  //       };
  //     } catch (err) {
  //       const errorMessage =
  //         err instanceof Error ? err.message : "Unknown error occurred";
  //       setError(errorMessage);
  //       setGenerationError(errorMessage);

  //       return {
  //         success: false,
  //         error: errorMessage,
  //         retryable: true,
  //       };
  //     } finally {
  //       setIsGenerating(false);
  //       setGenerating(false);
  //       // Reset progress after a delay
  //       setTimeout(() => setGenerationProgress(0), 1000);
  //     }
  //   },
  //   [
  //     setGenerating,
  //     setGenerationProgress,
  //     setGenerationError,
  //     clearGenerationError,
  //     updatePanel,
  //   ]
  // );

  // const retry = useCallback(async () => {
  //   if (!lastOptions) {
  //     console.error("No previous generation to retry");
  //     return {
  //       success: false,
  //       error: "No previous generation to retry",
  //       retryable: false,
  //     };
  //   }
  //   return generatePanel(lastOptions);
  // }, [generatePanel, lastOptions]);

  return {
    generatePanel: () => Promise.resolve({ success: false, error: "Not implemented" }),
    retry: () => Promise.resolve({ success: false, error: "Not implemented" }),
    isGenerating,
    error,
    canRetry: !!lastOptions,
  };
}
