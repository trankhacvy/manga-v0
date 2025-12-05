import { createServerSupabaseClient } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user from the request
 * Returns the user or null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Verify that the authenticated user owns the specified project
 * Returns true if authorized, false otherwise
 */
export async function verifyProjectOwnership(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      return false;
    }

    return project.user_id === userId;
  } catch (error) {
    console.error("Error verifying project ownership:", error);
    return false;
  }
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a 403 Forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
