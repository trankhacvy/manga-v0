import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { StyleType, ProjectModel } from "@/types";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse("You must be logged in to create a project");
    }

    const body = await request.json();
    const { title, genre, synopsis, style } = body;

    // Validate required fields
    if (!title || !style) {
      return NextResponse.json(
        { error: "Title and style are required" },
        { status: 400 }
      );
    }

    // Validate style type
    const validStyles: StyleType[] = [
      "shonen",
      "shojo",
      "chibi",
      "webtoon",
      "american",
      "noir",
    ];
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: "Invalid style type" },
        { status: 400 }
      );
    }

    // Use authenticated user's ID
    const projectUserId = user.id;

    // Insert project into database
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: projectUserId,
        title,
        genre: genre || "",
        synopsis: synopsis || "",
        style,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create project", details: error.message },
        { status: 500 }
      );
    }

    // Return the created project
    return NextResponse.json(
      {
        project: {
          id: project.id,
          userId: project.user_id,
          title: project.title,
          genre: project.genre,
          synopsis: project.synopsis,
          style: project.style,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/projects - Get all projects for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse("You must be logged in to view projects");
    }

    // Use authenticated user's ID (ignore any userId from query params for security)
    const queryUserId = user.id;

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", queryUserId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects", details: error.message },
        { status: 500 }
      );
    }

    // Transform to camelCase
    // const transformedProjects = projects.map((project: ProjectModel) => ({
    //   id: project.id,
    //   userId: project.user_id,
    //   title: project.title,
    //   genre: project.genre,
    //   synopsis: project.synopsis,
    //   style: project.style,
    //   createdAt: project.created_at,
    //   updatedAt: project.updated_at,
    // }));

    return NextResponse.json({ projects: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
