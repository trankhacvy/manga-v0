import { schemaTask, logger } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { z } from "zod";
import { Database } from "@/types/database.types";
import { PageSchema } from "./generateScript";
import { DEFAULT_LAYOUT_TEMPLATE, LAYOUT_TEMPLATES } from "@/lib/layout-templates";
import { PageInsert } from "@/types/models";


const GenerateStoryboardPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  pages: z.array(PageSchema).describe("Array of pages with panels"),
  characterIds: z
    .record(z.string(), z.string())
    .describe("Map of character names to IDs"),
  previewPageCount: z
    .number()
    .int()
    // .default(4)
    .describe("Number of preview pages to create"),
});

export const generateStoryboard = schemaTask({
  id: "generate-storyboard",
  schema: GenerateStoryboardPayloadSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    const { projectId, pages, characterIds, previewPageCount } = payload;

    logger.info("Starting storyboard generation", {
      projectId,
      totalPages: pages.length,
      previewPageCount,
    });

    // Update progress
    await appendProgress(
      {
        stage: "layouts",
        progress: 52,
        message: `📐 Planning page layouts for ${previewPageCount} pages...`,
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const supabase = await createClient();

      // Only create preview pages (first N pages)
      const pagesToCreate = pages.slice(0, previewPageCount);

      for (let pageIdx = 0; pageIdx < pagesToCreate.length; pageIdx++) {
        const pageData = pagesToCreate[pageIdx];

        // Get layout template
        const layoutTemplate = LAYOUT_TEMPLATES.find(template => template.id === pageData.layoutTemplateId) || DEFAULT_LAYOUT_TEMPLATE;
        const storyBeat = pageData.storyBeat || 'transition';
        const pageWidth = 1200;  // Standard manga width
        const pageHeight = 1800; // Standard manga height
        const pageMargins = { top: 20, right: 20, bottom: 20, left: 20 };

        // Create page record
        const { data: page, error: pageError } = await supabase
          .from("pages")
          .insert({
            project_id: projectId,
            page_number: pageData.pageNumber,
            layout_template_id: pageData.layoutTemplateId,
            layout_suggestion: '',
            layout_type: pageData.layoutTemplateId, // For backward compatibility
            // story_beat: storyBeat,
            width: pageWidth,
            height: pageHeight,
            margins: pageMargins,
            // panel_count: layoutTemplate.panelCount,
          })
          .select()
          .single();

        if (pageError || !page) {
          logger.error("Failed to create page", {
            projectId,
            pageNumber: pageData.pageNumber,
            error: pageError?.message,
          });
          throw new Error(`Failed to create page ${pageData.pageNumber}`);
        }

        // Calculate safe area
        const safeArea = {
          x: pageMargins.left,
          y: pageMargins.top,
          width: pageWidth - pageMargins.left - pageMargins.right,
          height: pageHeight - pageMargins.top - pageMargins.bottom,
        };

        // Create panels for this page using layout template
        const panelsToInsert = pageData.panels.map((panel, panelIdx: number) => {
          const panelTemplate = layoutTemplate.panels[panelIdx] || layoutTemplate.panels[0];
          
          // Convert relative to absolute positioning
          const absoluteX = Math.round(
            safeArea.x + (panelTemplate.x * safeArea.width) + panelTemplate.margins.left
          );
          const absoluteY = Math.round(
            safeArea.y + (panelTemplate.y * safeArea.height) + panelTemplate.margins.top
          );
          const absoluteWidth = Math.round(
            (panelTemplate.width * safeArea.width) - (panelTemplate.margins.left + panelTemplate.margins.right)
          );
          const absoluteHeight = Math.round(
            (panelTemplate.height * safeArea.height) - (panelTemplate.margins.top + panelTemplate.margins.bottom)
          );

          // Map character names to IDs and handles
          const charRefs = (panel.characters || [])
            .map((charName: string) => characterIds[charName])
            .filter(Boolean);

          const charHandles = (panel.characters || [])
            .map(
              (charName: string) =>
                `@${charName.toLowerCase().replace(/\s+/g, "")}`
            )
            .filter(Boolean);

          // Create bubbles array with placeholder positions
          // These will be updated by generateSmartBubbles task after images are generated
          const bubbles = [];
          
          // Add dialogue bubble if present
          if (panel.dialogue && panel.dialogue.trim()) {
            bubbles.push({
              id: `bubble-dialogue-${page.id}-${panelIdx}`,
              text: panel.dialogue,
              type: "standard",
              // Placeholder positions (will be updated by smart positioning)
              relativeX: 0.5,
              relativeY: 0.15,
              relativeWidth: 0.7,
              relativeHeight: 0.15,
              x: Math.round(absoluteWidth * 0.15),
              y: Math.round(absoluteHeight * 0.15),
              width: Math.round(absoluteWidth * 0.7),
              height: Math.round(absoluteHeight * 0.15),
              isManuallyPositioned: false,
            });
          }
          
          // Add narration bubble if present
          if (panel.narration && panel.narration.trim()) {
            bubbles.push({
              id: `bubble-narration-${page.id}-${panelIdx}`,
              text: panel.narration,
              type: "narration",
              // Placeholder positions (will be updated by smart positioning)
              relativeX: 0.5,
              relativeY: 0.05,
              relativeWidth: 0.8,
              relativeHeight: 0.12,
              x: Math.round(absoluteWidth * 0.1),
              y: Math.round(absoluteHeight * 0.05),
              width: Math.round(absoluteWidth * 0.8),
              height: Math.round(absoluteHeight * 0.12),
              isManuallyPositioned: false,
            });
          }

          return {
            page_id: page.id,
            panel_index: panelIdx,
            // Absolute positions
            x: absoluteX,
            y: absoluteY,
            width: absoluteWidth,
            height: absoluteHeight,
            // Relative positions (0-1 scale)
            relative_x: panelTemplate.x,
            relative_y: panelTemplate.y,
            relative_width: panelTemplate.width,
            relative_height: panelTemplate.height,
            // Visual properties
            z_index: panelTemplate.zIndex,
            panel_type: panelTemplate.panelType,
            border_style: 'solid',
            border_width: 2,
            panel_margins: panelTemplate.margins as any,
            // Content
            prompt: panel.prompt,
            character_refs: charRefs,
            character_handles: charHandles,
            character_ids: charRefs,
            style_locks: [],
            bubbles: bubbles,
          } as Database['public']['Tables']['panels']['Insert'];
        });

        const { error: panelsError } = await supabase
          .from("panels")
          .insert(panelsToInsert);

        if (panelsError) {
          logger.error("Failed to create panels", {
            projectId,
            pageNumber: pageData.pageNumber,
            error: panelsError.message,
          });
          throw new Error(
            `Failed to create panels for page ${pageData.pageNumber}`
          );
        }

        // Update progress
        const progress = 52 + ((pageIdx + 1) / pagesToCreate.length) * 8;
        await appendProgress(
          {
            stage: "layouts",
            progress: Math.round(progress),
            message: `Planned layout for page ${pageData.pageNumber}`,
            timestamp: new Date().toISOString(),
          },
          "parent"
        );
      }

      logger.info("Storyboard created successfully", {
        projectId,
        pageCount: pagesToCreate.length,
      });

      // Update progress with storyboard data
      await appendProgress(
        {
          stage: "layouts",
          progress: 60,
          message: "Page layouts planned!",
          timestamp: new Date().toISOString(),
          data: {
            layouts: {
              pageCount: pagesToCreate.length,
            },
            storyboard: {
              pageCount: pagesToCreate.length,
            },
          },
        },
        "parent"
      );

      // Update database
      await supabase
        .from("projects")
        .update({
          generation_stage: "storyboard",
          generation_progress: {
            script: 100,
            characters: 100,
            storyboard: 100,
            preview: 0,
          },
        })
        .eq("id", projectId);

      return {
        success: true,
        pageCount: pagesToCreate.length,
      };
    } catch (error) {
      logger.error("Storyboard generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Update database with error
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          generation_stage: "preview",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", projectId);

      throw error;
    }
  },
});
