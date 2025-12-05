import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  // { params }: { params: { projectId: string } }
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get characters
    const { data: characters } = await supabase
      .from("characters")
      .select("id, name, reference_images")
      .eq("project_id", projectId);

    // Get pages and panels
    const { data: pages } = await supabase
      .from("pages")
      .select("id, page_number, panels(id, panel_index, prompt, image_url)")
      .eq("project_id", projectId)
      .order("page_number", { ascending: true });

    // Format response
    const response = {
      status: project.generation_stage,
      progress: calculateProgress(project.generation_progress),
      currentStep: getCurrentStep(project.generation_stage),
      script: project.script_data?.title || undefined,
      characters: characters?.map((char) => ({
        id: char.id,
        name: char.name,
        imageUrl: char.reference_images?.front || undefined,
      })) || [],
      storyboard: pages?.flatMap((page) =>
        (page.panels || []).map((panel: any) => ({
          panelNumber: panel.panel_index,
          description: panel.prompt,
          imageUrl: panel.image_url || undefined,
        }))
      ) || [],
      previewPages: pages?.map((page) => ({
        pageNumber: page.page_number,
        imageUrl: undefined, // Will be populated when page images are generated
      })) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch progress",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function calculateProgress(generationProgress: {
  script: number;
  characters: number;
  storyboard: number;
  preview: number;
}): number {
  const weights = {
    script: 0.25,
    characters: 0.25,
    storyboard: 0.25,
    preview: 0.25,
  };

  return Math.round(
    generationProgress.script * weights.script +
      generationProgress.characters * weights.characters +
      generationProgress.storyboard * weights.storyboard +
      generationProgress.preview * weights.preview
  );
}

function getCurrentStep(stage: string): string {
  const steps: Record<string, string> = {
    queued: "Initializing...",
    script: "Generating script...",
    characters: "Creating characters...",
    storyboard: "Building storyboard...",
    images: "Generating images...",
    complete: "Complete!",
    failed: "Generation failed",
  };

  return steps[stage] || "Processing...";
}
