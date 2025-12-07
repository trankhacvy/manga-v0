// Toast Notification Wrapper
// Provides a consistent interface for displaying toast notifications

import { toast as sonnerToast, ExternalToast } from "sonner";
import { MangaIDEError } from "./errors";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions extends ExternalToast {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Display a success toast
 */
export function success(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.success(message, {
    duration: options?.duration ?? 4000,
    ...options,
  });
}

/**
 * Display an error toast
 */
export function error(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.error(message, {
    duration: options?.duration ?? 6000,
    ...options,
  });
}

/**
 * Display a warning toast
 */
export function warning(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.warning(message, {
    duration: options?.duration ?? 5000,
    ...options,
  });
}

/**
 * Display an info toast
 */
export function info(message: string, options?: ToastOptions): string | number {
  return sonnerToast.info(message, {
    duration: options?.duration ?? 4000,
    ...options,
  });
}

/**
 * Display a loading toast
 */
export function loading(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.loading(message, options);
}

/**
 * Display a promise toast (shows loading, then success/error based on promise result)
 */
export function promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
): Promise<T> {
  // @ts-expect-error
  return sonnerToast.promise(promise, messages, options);
}

/**
 * Dismiss a specific toast by ID
 */
export function dismiss(toastId?: string | number): void {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAll(): void {
  sonnerToast.dismiss();
}

/**
 * Handle error and display appropriate toast
 */
export function handleError(err: unknown, fallbackMessage?: string): void {
  if (err instanceof MangaIDEError) {
    error(err.message, {
      description: err.retryable ? "You can try again" : undefined,
    });
  } else if (err instanceof Error) {
    error(err.message || fallbackMessage || "An error occurred");
  } else {
    error(fallbackMessage || "An unexpected error occurred");
  }
}

/**
 * Display a toast for an async operation with automatic error handling
 */
export async function withToast<T>(
  operation: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error?: string | ((error: any) => string);
  },
  options?: ToastOptions
): Promise<T> {
  return promise(
    operation,
    {
      loading: messages.loading,
      success: messages.success,
      error:
        messages.error ||
        ((err) => {
          if (err instanceof MangaIDEError) {
            return err.message;
          }
          if (err instanceof Error) {
            return err.message;
          }
          return "Operation failed";
        }),
    },
    options
  );
}

/**
 * Display a custom toast with retry action
 */
export function errorWithRetry(
  message: string,
  onRetry: () => void,
  options?: ToastOptions
): string | number {
  return error(message, {
    ...options,
    action: {
      label: "Retry",
      onClick: onRetry,
    },
  });
}

/**
 * Display a custom toast with undo action
 */
export function successWithUndo(
  message: string,
  onUndo: () => void,
  options?: ToastOptions
): string | number {
  return success(message, {
    ...options,
    action: {
      label: "Undo",
      onClick: onUndo,
    },
  });
}

// Re-export the toast object for advanced usage
export { sonnerToast as toast };
