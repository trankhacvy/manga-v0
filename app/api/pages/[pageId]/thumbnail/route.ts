// API route for generating and uploading page thumbnails
// POST /api/pages/[pageId]/thumbnail

import { NextRequest, NextResponse } from "next/server";
import { generateAndUploadPageThumbnail } from "@/lib/image-upload-pipeline";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    // Import auth utilities
    const {
      getAuthenticatedUser,
      verifyProjectOwnership,
      unauthorizedResponse,
      forbiddenResponse,
    } = await import("@/lib/api-auth");

    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse(
        "You must be logged in to generate thumbnails"
      );
    }

    const { pageId } = await params;
    const body = await request.json();
    const { projectId, maxWidth, maxHeight, quality } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const isAuthorized = await verifyProjectOwnership(user.id, projectId);
    if (!isAuthorized) {
      return forbiddenResponse(
        "You do not have permission to generate thumbnails for this project"
      );
    }

    // Generate and upload thumbnail
    const result = await generateAndUploadPageThumbnail(projectId, pageId, {
      maxWidth: maxWidth || 300,
      maxHeight: maxHeight || 400,
      quality: quality || 0.8,
    });

    return NextResponse.json({
      success: true,
      thumbnailUrl: result.url,
      storagePath: result.path,
    });
  } catch (error) {
    console.error("Failed to generate page thumbnail:", error);
    return NextResponse.json(
      {
        error: "Failed to generate thumbnail",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
