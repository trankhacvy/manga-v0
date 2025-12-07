// import { NextRequest, NextResponse } from "next/server";
// import PDFDocument from "pdfkit";
// import { createCanvas, loadImage } from "canvas";
// import {
//   getAuthenticatedUser,
//   unauthorizedResponse,
//   forbiddenResponse,
// } from "@/lib/api-auth";
// import { createServerSupabaseClient } from "@/lib/auth";
// import type { PanelModel, SpeechBubbleModel, PageModel } from "@/types";

// /**
//  * Export a project to PDF
//  * GET /api/export/pdf?projectId=xxx
//  */
// export async function GET(request: NextRequest) {
//   try {
//     // Authenticate user
//     const user = await getAuthenticatedUser();
//     if (!user) {
//       return unauthorizedResponse();
//     }

//     // Get query parameters
//     const searchParams = request.nextUrl.searchParams;
//     const projectId = searchParams.get("projectId");

//     if (!projectId) {
//       return NextResponse.json(
//         { error: "projectId is required" },
//         { status: 400 }
//       );
//     }

//     // Get project data from database
//     const supabase = await createServerSupabaseClient();
//     const { data: project, error: projectError } = await supabase
//       .from("projects")
//       .select("*")
//       .eq("id", projectId)
//       .single();

//     if (projectError || !project) {
//       return NextResponse.json({ error: "Project not found" }, { status: 404 });
//     }

//     // Verify user owns the project
//     if (project.user_id !== user.id) {
//       return forbiddenResponse();
//     }

//     // Get all pages for this project
//     const { data: pages, error: pagesError } = await supabase
//       .from("pages")
//       .select("*")
//       .eq("project_id", projectId)
//       .order("page_number");

//     if (pagesError) {
//       return NextResponse.json(
//         { error: "Failed to fetch pages" },
//         { status: 500 }
//       );
//     }

//     if (!pages || pages.length === 0) {
//       return NextResponse.json(
//         { error: "No pages found in project" },
//         { status: 404 }
//       );
//     }

//     // Get all panels for all pages
//     const pageIds = pages.map((p) => p.id);
//     const { data: allPanels, error: panelsError } = await supabase
//       .from("panels")
//       .select("*")
//       .in("page_id", pageIds)
//       .order("panel_index");

//     if (panelsError) {
//       return NextResponse.json(
//         { error: "Failed to fetch panels" },
//         { status: 500 }
//       );
//     }

//     // Group panels by page
//     const panelsByPage = new Map<string, PanelModel[]>();
//     // @ts-expect-error
//     for (const panel of allPanels as PanelModel[]) {
//       if (!panelsByPage.has(panel.page_id)) {
//         panelsByPage.set(panel.page_id, []);
//       }
//       panelsByPage.get(panel.page_id)!.push(panel);
//     }

//     // Create PDF document
//     const doc = new PDFDocument({
//       size: "A4",
//       margin: 0,
//       autoFirstPage: false,
//     });

//     // Collect PDF chunks
//     const chunks: Buffer[] = [];
//     doc.on("data", (chunk) => chunks.push(chunk));

//     // Add metadata
//     doc.info.Title = project.title;
//     doc.info.Author = user.email || "Manga IDE User";
//     doc.info.Subject = project.genre || "Manga";
//     doc.info.Creator = "Manga IDE";

//     // Render each page
//     for (const page of pages as PageModel[]) {
//       const panels = panelsByPage.get(page.id) || [];
//       await renderPageToPDF(doc, page, panels);
//     }

//     // Finalize PDF
//     doc.end();

//     // Wait for PDF to finish
//     await new Promise<void>((resolve) => {
//       doc.on("end", () => resolve());
//     });

//     // Combine chunks into single buffer
//     const pdfBuffer = Buffer.concat(chunks);

//     // Return PDF
//     const filename = `${sanitizeFilename(project.title)}.pdf`;

//     return new NextResponse(pdfBuffer, {
//       headers: {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename="${filename}"`,
//         "Cache-Control": "no-cache",
//       },
//     });
//   } catch (error) {
//     console.error("Error exporting PDF:", error);
//     return NextResponse.json(
//       { error: "Failed to export PDF" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * Render a single page to the PDF document
//  */
// async function renderPageToPDF(
//   doc: PDFKit.PDFDocument,
//   page: PageModel,
//   panels: PanelModel[]
// ): Promise<void> {
//   // Calculate page dimensions based on panels
//   const dimensions = calculatePageDimensions(panels);

//   // Add new page to PDF
//   doc.addPage({
//     size: [dimensions.width, dimensions.height],
//     margin: 0,
//   });

//   // Set white background
//   doc.rect(0, 0, dimensions.width, dimensions.height).fill("#ffffff");

//   // Render each panel
//   for (const panel of panels) {
//     await renderPanelToPDF(doc, panel);
//   }
// }

// /**
//  * Calculate page dimensions based on panel positions
//  */
// function calculatePageDimensions(panels: PanelModel[]): {
//   width: number;
//   height: number;
// } {
//   if (panels.length === 0) {
//     return { width: 595, height: 842 }; // A4 size in points
//   }

//   // Find the maximum extents
//   let maxX = 0;
//   let maxY = 0;

//   for (const panel of panels) {
//     const panelRight = panel.x + panel.width;
//     const panelBottom = panel.y + panel.height;
//     maxX = Math.max(maxX, panelRight);
//     maxY = Math.max(maxY, panelBottom);
//   }

//   // Add padding
//   const padding = 20;
//   const width = maxX + padding;
//   const height = maxY + padding;

//   return { width, height };
// }

// /**
//  * Render a single panel to the PDF document
//  */
// async function renderPanelToPDF(
//   doc: PDFKit.PDFDocument,
//   panel: PanelModel
// ): Promise<void> {
//   // Draw panel border
//   doc
//     .rect(panel.x, panel.y, panel.width, panel.height)
//     .lineWidth(2)
//     .stroke("#000000");

//   // Load and draw panel image if available
//   if (panel.image_url) {
//     try {
//       // Create a canvas to load the image
//       const canvas = createCanvas(panel.width, panel.height);
//       const ctx = canvas.getContext("2d");

//       const image = await loadImage(panel.image_url);

//       // Draw image to canvas
//       ctx.drawImage(image, 0, 0, panel.width, panel.height);

//       // Convert canvas to buffer
//       const imageBuffer = canvas.toBuffer("image/png");

//       // Add image to PDF
//       doc.image(imageBuffer, panel.x, panel.y, {
//         width: panel.width,
//         height: panel.height,
//       });
//     } catch (error) {
//       console.error(`Failed to load panel image: ${panel.image_url}`, error);
//       // Draw placeholder
//       doc.rect(panel.x, panel.y, panel.width, panel.height).fill("#f0f0f0");
//     }
//   }

//   // Draw speech bubbles
//   if (panel.bubbles && panel.bubbles.length > 0) {
//     for (const bubble of panel.bubbles) {
//       renderSpeechBubbleToPDF(doc, bubble, panel);
//     }
//   }
// }

// /**
//  * Render a speech bubble to the PDF document
//  */
// function renderSpeechBubbleToPDF(
//   doc: PDFKit.PDFDocument,
//   bubble: SpeechBubbleModel,
//   panel: PanelModel
// ): void {
//   const x = panel.x + bubble.x;
//   const y = panel.y + bubble.y;
//   const width = bubble.width;
//   const height = bubble.height;

//   // Draw bubble background
//   const radius = 10;

//   if (bubble.type === "thought") {
//     // Draw ellipse for thought bubbles
//     doc
//       .ellipse(x + width / 2, y + height / 2, width / 2, height / 2)
//       .fill("#ffffff")
//       .stroke("#000000");
//   } else {
//     // Draw rounded rectangle for other bubble types
//     doc
//       .roundedRect(x, y, width, height, radius)
//       .fill("#ffffff")
//       .lineWidth(2)
//       .stroke("#000000");
//   }

//   // Draw text
//   const fontSize =
//     bubble.type === "shout" ? 14 : bubble.type === "whisper" ? 10 : 12;
//   const fontStyle = bubble.type === "shout" ? "bold" : "normal";

//   doc
//     .font(fontStyle === "bold" ? "Helvetica-Bold" : "Helvetica")
//     .fontSize(fontSize)
//     .fillColor("#000000");

//   // Center text in bubble
//   const textOptions = {
//     width: width - 10,
//     align: "center" as const,
//     lineGap: 2,
//   };

//   // Calculate vertical centering
//   const textHeight = doc.heightOfString(bubble.text, textOptions);
//   const textY = y + (height - textHeight) / 2;

//   doc.text(bubble.text, x + 5, textY, textOptions);
// }

// /**
//  * Sanitize filename for safe file system usage
//  */
// function sanitizeFilename(filename: string): string {
//   return filename
//     .replace(/[^a-z0-9]/gi, "_")
//     .replace(/_+/g, "_")
//     .toLowerCase();
// }

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
) {
  try {
    return NextResponse.json({success: true});
  } catch (error) {
    console.error("Preview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
