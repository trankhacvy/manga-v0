import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateManga } from "@/trigger/manga";
import { auth } from "@trigger.dev/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface QuickStartGenerateRequest {
  storyDescription: string;
  genre?: string;
  artStyle: string;
  pageCount: number;
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body: QuickStartGenerateRequest = await request.json();
    const { storyDescription, genre, artStyle, pageCount } = body;

    if (!storyDescription || !artStyle || !pageCount) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: storyDescription, artStyle, and pageCount",
        },
        { status: 400 }
      );
    }

    if (pageCount < 1 || pageCount > 16) {
      return NextResponse.json(
        { error: "Page count must be between 1 and 16" },
        { status: 400 }
      );
    }

    // Create empty project record
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: "New Manga",
        genre: genre || "",
        synopsis: storyDescription,
        style: artStyle,
        generation_stage: "script",
        preview_only: true,
        total_pages: pageCount,
        generation_progress: {
          script: 0,
          characters: 0,
          storyboard: 0,
          preview: 0,
        },
      })
      .select('*')
      .single();

    if (projectError || !project) {
      console.error("Failed to create project:", projectError);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    // Trigger the main manga generation task using schemaTask
    // This will validate the payload against the schema
    const handle = await generateManga.trigger({
      projectId: project.id,
      storyDescription,
      genre,
      artStyle,
      pageCount,
    }, undefined, {
      clientConfig: {
        future: {
          v2RealtimeStreams: true,
        },
      }
    });

    console.log("Manga generation task triggered", {
      projectId: project.id,
      runId: handle.id,
    });

    // Generate public access token for streaming
    // const publicAccessToken = await auth.createPublicToken({
    //   scopes: {
    //     read: {
    //       runs: [handle.id], // Only allow reading this specific run
    //     },
    //   },
    //   expirationTime: "1h", // Token expires in 1 hour
    // });

    // Calculate estimated time (approximately 2-3 minutes for 8 pages)
    const estimatedTime = Math.ceil(pageCount * 15); // ~15 seconds per page

    // Return immediately with project ID, run ID, and access token
    return NextResponse.json({
      success: true,
      projectId: project.id,
      runId: handle.id,
      accessToken: handle.publicAccessToken,
      estimatedTime, // in seconds
      message: "Manga generation started successfully",
    });
  } catch (error) {
    console.error("Quick-start generation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
