import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const supabase = await createClient();
    const { pageId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch panels for this page
    const { data: panels, error: panelsError } = await supabase
      .from("panels")
      .select("*")
      .eq("page_id", pageId)
      .order("panel_index", { ascending: true });

    if (panelsError) {
      console.error("Failed to fetch panels:", panelsError);
      return NextResponse.json(
        { error: "Failed to fetch panels" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      panels: panels || [],
    });
  } catch (error) {
    console.error("Error fetching panels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
