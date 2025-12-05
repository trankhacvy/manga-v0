"use client";

import { Streamdown } from "streamdown";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Markdown component for rendering markdown content
 * Uses Streamdown for streaming-optimized markdown rendering
 *
 * @example
 * ```tsx
 * <Markdown>
 *   # Hello World
 *   This is **bold** and *italic* text.
 * </Markdown>
 * ```
 */
export function Markdown({ children, className = "" }: MarkdownProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <Streamdown>{children}</Streamdown>
    </div>
  );
}
