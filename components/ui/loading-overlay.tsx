"use client";

import React from "react";
import { Spinner } from "@/components/ui/spinner";

interface LoadingOverlayProps {
  message?: string;
  progress?: number; // 0-100
  isVisible: boolean;
}

/**
 * Loading overlay component for long operations
 * Shows a semi-transparent overlay with spinner and optional progress
 */
export function LoadingOverlay({
  message = "Loading...",
  progress,
  isVisible,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg border">
        <Spinner className="h-8 w-8" />
        <div className="text-center">
          <p className="text-sm font-medium">{message}</p>
          {progress !== undefined && (
            <div className="mt-3 w-64">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
