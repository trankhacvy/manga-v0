import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return unauthorizedResponse("You must be logged in to view characters");
    }

    const { projectId } = await params;

    // Verify user owns the project
    const isAuthorized = await verifyProjectOwnership(user.id, projectId);
    if (!isAuthorized) {
      return forbiddenResponse(
        "You do not have permission to view characters in this project"
      );
    }

    // Fetch all characters for this project
    const { data: characters, error } = await supabase
      .from("characters")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch characters:", error);
      return NextResponse.json(
        { error: "Failed to fetch characters" },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transformedCharacters = characters.map((char) => ({
      id: char.id,
      projectId: char.project_id,
      name: char.name,
      handle: char.handle,
      description: char.description,
      referenceImages: char.reference_images,
      turnaround: char.turnaround,
      expressions: char.expressions,
      promptTriggers: char.prompt_triggers,
      createdAt: char.created_at,
    }));

    return NextResponse.json({
      characters: transformedCharacters,
      count: transformedCharacters.length,
    });
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch characters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
