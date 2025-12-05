/**
 * Typed fetch wrapper for API calls
 * Handles error responses and provides type-safe data fetching
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Array<{ message: string }>
  ) {
    super(message);
    this.name = "APIError";
  }
}

export async function fetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      ...options?.headers,
    },
  });

  const json = await response.json();

  if (response.ok) {
    return json as T;
  } else {
    // Try to extract error message from common error response formats
    const errorMessage =
      (json as any)?.errors?.map((e: any) => e.message).join("\n") ??
      (json as any)?.error ??
      (json as any)?.message ??
      "Unknown error";
    return Promise.reject(
      new APIError(errorMessage, response.status, (json as any)?.errors)
    );
  }
}
