import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to continue." },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Fetch project with all metadata
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, title, total_pages, preview_only, generation_stage, genre, style, synopsis, story_analysis"
      )
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      console.error("Failed to fetch project:", projectError);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch characters for this project
    const { data: characters, error: charactersError } = await supabase
      .from("characters")
      .select(
        "id, name, handle, description, reference_images, turnaround, expressions, prompt_triggers"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (charactersError) {
      console.error("Failed to fetch characters:", charactersError);
    }

    // Fetch preview pages (first 4 pages)
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id, page_number, width, height, layout_suggestion, layout_template_id, layout_type")
      .eq("project_id", projectId)
      .lte("page_number", 40)
      .order("page_number", { ascending: true });

    if (pagesError) {
      console.error("Failed to fetch pages:", pagesError);
      return NextResponse.json(
        { error: "Failed to fetch preview pages" },
        { status: 500 }
      );
    }

    // Fetch all panels for these pages
    const pageIds = (pages || []).map((p) => p.id);
    const { data: panels, error: panelsError } = await supabase
      .from("panels")
      .select(
        `
        id,
        page_id,
        panel_index,
        x,
        y,
        width,
        height,
        relative_x,
        relative_y,
        relative_width,
        relative_height,
        z_index,
        panel_type,
        border_style,
        border_width,
        panel_margins,
        image_url,
        thumbnail_url,
        prompt,
        character_handles,
        character_ids,
        style_locks,
        bubbles,
        bubble_positions,
        sketch_url,
        controlnet_strength,
        generation_params
      `
      )
      .in("page_id", pageIds)
      .order("panel_index", { ascending: true });

    if (panelsError) {
      console.error("Failed to fetch panels:", panelsError);
    }

    // Group panels by page
    const panelsByPage = (panels || []).reduce(
      (acc: Record<string, any[]>, panel: any) => {
        if (!acc[panel.page_id]) {
          acc[panel.page_id] = [];
        }
        acc[panel.page_id].push(panel);
        return acc;
      },
      {}
    );

    // Format pages with complete data
    const formattedPages = (pages || []).map((page: any) => {
      const pagePanels = panelsByPage[page.id] || [];

      // Generate thumbnail from first panel or composite
      const thumbnailUrl =
        pagePanels[0]?.thumbnail_url ||
        pagePanels[0]?.image_url ||
        undefined;

      return {
        id: page.id,
        pageNumber: page.page_number,
        width: page.width,
        height: page.height,
        // Use layout_template_id if available, fallback to layout_suggestion or layout_type
        layoutSuggestion: page.layout_template_id || page.layout_suggestion || page.layout_type,
        thumbnailUrl,
        panels: pagePanels.map((panel: any) => ({
          id: panel.id,
          panelIndex: panel.panel_index,
          x: panel.x,
          y: panel.y,
          width: panel.width,
          height: panel.height,
          relativeX: panel.relative_x,
          relativeY: panel.relative_y,
          relativeWidth: panel.relative_width,
          relativeHeight: panel.relative_height,
          zIndex: panel.z_index,
          panelType: panel.panel_type,
          borderStyle: panel.border_style,
          borderWidth: panel.border_width,
          panelMargins: panel.panel_margins,
          imageUrl: panel.image_url,
          thumbnailUrl: panel.thumbnail_url,
          prompt: panel.prompt,
          characterHandles: panel.character_handles || [],
          characterIds: panel.character_ids || [],
          styleLocks: panel.style_locks || [],
          bubbles: panel.bubbles || [],
          bubblePositions: panel.bubble_positions,
          sketchUrl: panel.sketch_url,
          controlnetStrength: panel.controlnet_strength,
          generationParams: panel.generation_params,
        })),
      };
    });

    // Format characters
    const formattedCharacters = (characters || []).map((char: any) => ({
      id: char.id,
      name: char.name,
      handle: char.handle,
      description: char.description,
      referenceImages: char.reference_images,
      turnaround: char.turnaround,
      expressions: char.expressions || [],
      promptTriggers: char.prompt_triggers || [],
    }));

    // Return complete preview data
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        totalPages: project.total_pages || 8,
        previewOnly: project.preview_only,
        generationStage: project.generation_stage,
        genre: project.genre,
        style: project.style,
        synopsis: project.synopsis,
        storyAnalysis: project.story_analysis,
      },
      characters: formattedCharacters,
      pages: formattedPages,
      // Legacy field for backward compatibility
      previewPages: formattedPages,
    });
  } catch (error) {
    console.error("Preview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
