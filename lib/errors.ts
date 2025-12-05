// Error Handling Utilities
// Custom error classes and error logging for the Manga IDE

/**
 * Base error class for all Manga IDE errors
 */
export class MangaIDEError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends MangaIDEError {
  constructor(
    message: string = "Authentication required",
    originalError?: unknown
  ) {
    super(message, "AUTH_REQUIRED", false, 401, originalError);
  }
}

export class AuthorizationError extends MangaIDEError {
  constructor(message: string = "Permission denied", originalError?: unknown) {
    super(message, "PERMISSION_DENIED", false, 403, originalError);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends MangaIDEError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>,
    originalError?: unknown
  ) {
    super(message, "VALIDATION_ERROR", false, 400, originalError);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields,
    };
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends MangaIDEError {
  constructor(resource: string, id?: string, originalError?: unknown) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", false, 404, originalError);
  }
}

/**
 * Database operation errors
 */
export class DatabaseError extends MangaIDEError {
  constructor(
    message: string,
    retryable: boolean = true,
    originalError?: unknown
  ) {
    super(message, "DATABASE_ERROR", retryable, 500, originalError);
  }
}

/**
 * Storage operation errors
 */
export class StorageError extends MangaIDEError {
  constructor(
    message: string,
    retryable: boolean = true,
    originalError?: unknown
  ) {
    super(message, "STORAGE_ERROR", retryable, 500, originalError);
  }
}

/**
 * AI service errors (image generation, LLM, etc.)
 */
export class AIServiceError extends MangaIDEError {
  constructor(
    message: string,
    public readonly service: string,
    retryable: boolean = true,
    originalError?: unknown
  ) {
    super(message, "AI_SERVICE_ERROR", retryable, 503, originalError);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service,
    };
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends MangaIDEError {
  constructor(
    message: string = "Rate limit exceeded",
    public readonly retryAfter?: number,
    originalError?: unknown
  ) {
    super(message, "RATE_LIMIT", true, 429, originalError);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends MangaIDEError {
  constructor(message: string, originalError?: unknown) {
    super(message, "CONFIGURATION_ERROR", false, 500, originalError);
  }
}

/**
 * Error logger interface
 */
export interface ErrorLogger {
  logError(error: Error, context?: Record<string, any>): void;
  logWarning(message: string, context?: Record<string, any>): void;
  logInfo(message: string, context?: Record<string, any>): void;
}

/**
 * Console error logger (default implementation)
 */
class ConsoleErrorLogger implements ErrorLogger {
  logError(error: Error, context?: Record<string, any>): void {
    console.error("[ERROR]", error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }

  logWarning(message: string, context?: Record<string, any>): void {
    console.warn("[WARNING]", message, context);
  }

  logInfo(message: string, context?: Record<string, any>): void {
    console.log("[INFO]", message, context);
  }
}

/**
 * Sentry error logger (for production)
 */
class SentryErrorLogger implements ErrorLogger {
  private initialized = false;

  constructor() {
    this.initializeSentry();
  }

  private initializeSentry(): void {
    // Only initialize in production and if DSN is configured
    if (process.env.NODE_ENV !== "production" || !process.env.SENTRY_DSN) {
      return;
    }

    try {
      // Dynamic import to avoid bundling Sentry in development
      // In production, you would install @sentry/nextjs and configure it
      // import * as Sentry from "@sentry/nextjs";
      // Sentry.init({
      //   dsn: process.env.SENTRY_DSN,
      //   environment: process.env.NODE_ENV,
      //   tracesSampleRate: 0.1,
      // });
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Sentry:", error);
    }
  }

  logError(error: Error, context?: Record<string, any>): void {
    if (this.initialized) {
      // In production with Sentry installed:
      // Sentry.captureException(error, { extra: context });
    }
    // Fallback to console
    console.error("[ERROR]", error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }

  logWarning(message: string, context?: Record<string, any>): void {
    if (this.initialized) {
      // In production with Sentry installed:
      // Sentry.captureMessage(message, { level: "warning", extra: context });
    }
    console.warn("[WARNING]", message, context);
  }

  logInfo(message: string, context?: Record<string, any>): void {
    console.log("[INFO]", message, context);
  }
}

// Global error logger instance
let errorLogger: ErrorLogger;

/**
 * Initialize the error logger
 */
export function initializeErrorLogger(logger?: ErrorLogger): void {
  if (logger) {
    errorLogger = logger;
  } else {
    // Use Sentry in production, console in development
    errorLogger =
      process.env.NODE_ENV === "production"
        ? new SentryErrorLogger()
        : new ConsoleErrorLogger();
  }
}

/**
 * Get the current error logger instance
 */
export function getErrorLogger(): ErrorLogger {
  if (!errorLogger) {
    initializeErrorLogger();
  }
  return errorLogger;
}

/**
 * Log an error with context
 */
export function logError(error: Error, context?: Record<string, any>): void {
  getErrorLogger().logError(error, context);
}

/**
 * Log a warning with context
 */
export function logWarning(
  message: string,
  context?: Record<string, any>
): void {
  getErrorLogger().logWarning(message, context);
}

/**
 * Log info with context
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  getErrorLogger().logInfo(message, context);
}

/**
 * Handle API errors and return appropriate response
 */
export function handleAPIError(error: unknown): {
  message: string;
  code: string;
  retryable: boolean;
  statusCode: number;
} {
  // Handle known error types
  if (error instanceof MangaIDEError) {
    logError(error, { code: error.code });
    return {
      message: error.message,
      code: error.code,
      retryable: error.retryable,
      statusCode: error.statusCode,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    logError(error);
    return {
      message: error.message,
      code: "INTERNAL_ERROR",
      retryable: false,
      statusCode: 500,
    };
  }

  // Handle unknown errors
  logError(new Error("Unknown error occurred"), { error });
  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    retryable: false,
    statusCode: 500,
  };
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error;
    }
  }) as T;
}
