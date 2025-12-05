/**
 * Export utilities for manga pages and projects
 */

export type ImageFormat = "png" | "jpg" | "jpeg";
export type ExportQuality = "high" | "medium" | "low";

/**
 * Export a page to an image file
 */
export async function exportPageToImage(
  pageId: string,
  options: {
    format?: ImageFormat;
    quality?: ExportQuality;
    filename?: string;
  } = {}
): Promise<void> {
  const { format = "png", quality = "high", filename } = options;

  try {
    const params = new URLSearchParams({
      pageId,
      format,
      quality,
    });

    const response = await fetch(`/api/export/page?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to export page");
    }

    // Get the blob
    const blob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `page.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting page:", error);
    throw error;
  }
}

/**
 * Export a project to a PDF file
 */
export async function exportProjectToPDF(
  projectId: string,
  options: {
    filename?: string;
  } = {}
): Promise<void> {
  const { filename } = options;

  try {
    const params = new URLSearchParams({
      projectId,
    });

    const response = await fetch(`/api/export/pdf?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to export project");
    }

    // Get the blob
    const blob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "manga.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting project:", error);
    throw error;
  }
}

/**
 * Get the download URL for a page export (without triggering download)
 */
export async function getPageExportUrl(
  pageId: string,
  options: {
    format?: ImageFormat;
    quality?: ExportQuality;
  } = {}
): Promise<string> {
  const { format = "png", quality = "high" } = options;

  const params = new URLSearchParams({
    pageId,
    format,
    quality,
  });

  const response = await fetch(`/api/export/page?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to export page");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Get the download URL for a project PDF export (without triggering download)
 */
export async function getProjectPDFUrl(projectId: string): Promise<string> {
  const params = new URLSearchParams({
    projectId,
  });

  const response = await fetch(`/api/export/pdf?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to export project");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
