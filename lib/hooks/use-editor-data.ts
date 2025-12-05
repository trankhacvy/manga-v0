import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { toast } from "sonner";

interface UseEditorDataOptions {
  projectId: string;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

interface UseEditorDataReturn {
  isLoading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  isRetrying: boolean;
  retryCount: number;
}

/**
 * Hook to load and manage editor data for a project
 * Fetches project, pages, panels, and characters from database
 * Handles loading states, errors, and automatic retry logic
 */
export function useEditorData(options: UseEditorDataOptions): UseEditorDataReturn {
  const {
    projectId,
    autoRetry = true,
    maxRetries = 3,
    retryDelay = 2000,
  } = options;

  const loadProject = useEditorStore((state) => state.loadProject);
  const isLoading = useEditorStore((state) => state.isLoading);
  const error = useEditorStore((state) => state.error);
  const clearError = useEditorStore((state) => state.clearError);

  const retryCountRef = useRef(0);
  const isRetryingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  /**
   * Load project data with error handling
   */
  const loadData = useCallback(async () => {
    if (!projectId) {
      console.warn("useEditorData: No projectId provided");
      return;
    }

    try {
      clearError();
      await loadProject(projectId);
      
      // Reset retry count on successful load
      retryCountRef.current = 0;
      isRetryingRef.current = false;
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to load editor data:", err);
      
      // If auto-retry is enabled and we haven't exceeded max retries
      if (autoRetry && retryCountRef.current < maxRetries) {
        isRetryingRef.current = true;
        retryCountRef.current += 1;
        
        console.log(
          `Retrying data load (attempt ${retryCountRef.current}/${maxRetries}) in ${retryDelay}ms...`
        );
        
        toast.info(`Retrying... (Attempt ${retryCountRef.current}/${maxRetries})`);
        
        // Schedule retry with exponential backoff
        const backoffDelay = retryDelay * Math.pow(2, retryCountRef.current - 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          loadData();
        }, backoffDelay);
      } else {
        isRetryingRef.current = false;
        
        if (retryCountRef.current >= maxRetries) {
          console.error(
            `Failed to load editor data after ${maxRetries} retries`
          );
          toast.error("Failed to load editor data", {
            description: "Please try again or contact support if the issue persists",
          });
        }
      }
    }
  }, [projectId, loadProject, clearError, autoRetry, maxRetries, retryDelay]);

  /**
   * Manual retry function
   */
  const retry = useCallback(async () => {
    // Reset retry count for manual retries
    retryCountRef.current = 0;
    isRetryingRef.current = false;
    
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    await loadData();
  }, [loadData]);

  /**
   * Load data on mount or when projectId changes
   */
  useEffect(() => {
    // Only load if we haven't loaded this project yet
    if (!hasLoadedRef.current || projectId) {
      hasLoadedRef.current = false;
      loadData();
    }

    // Cleanup: clear any pending retry timeouts
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [projectId, loadData]);

  return {
    isLoading,
    error,
    retry,
    isRetrying: isRetryingRef.current,
    retryCount: retryCountRef.current,
  };
}
